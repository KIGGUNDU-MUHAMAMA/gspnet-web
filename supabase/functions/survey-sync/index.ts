import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * survey-sync  –  Geospatial Network Uganda
 * ==========================================
 * A standalone Edge Function that handles polygon broadcasting
 * from desktop plugins (AutoCAD GSPWEBSYNC, QGIS gsp_surveysync)
 * to the live webmap via Supabase Realtime.
 *
 * This function is SEPARATE from polygon-creator and does NOT
 * touch the polygon_features table or any existing workflows.
 *
 * Actions:
 *   broadcast_polygon  – validate geometry, fire Realtime event (no auth required)
 *   save_polygon       – commit a previously-broadcast polygon to the DB (auth required)
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_LAYERS = [
  "BLB-UNTITLED",
  "UNTITLED UTM ZONE 36S",
  "UNTITLED UTM ZONE 36N",
  "TITLE TRACTS UTM ZONE 36S",
  "TITLE TRACTS UTM ZONE 36N",
];

const LAYER_PREFIX: Record<string, string> = {
  "BLB-UNTITLED": "BLB",
  "UNTITLED UTM ZONE 36S": "UT36S",
  "UNTITLED UTM ZONE 36N": "UT36N",
  "TITLE TRACTS UTM ZONE 36S": "TT36S",
  "TITLE TRACTS UTM ZONE 36N": "TT36N",
};

type InputPoint = { x: number; y: number };

// ── Helpers ────────────────────────────────────────────────────────────────────

function fail(status: number, message: string) {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

function ok(payload: Record<string, unknown>) {
  return new Response(
    JSON.stringify({ success: true, ...payload }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

function toRadians(deg: number): number { return (deg * Math.PI) / 180; }

function isValidLonLat(lon: number, lat: number): boolean {
  return Number.isFinite(lon) && Number.isFinite(lat) &&
    lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90;
}

function areaHectares(ring: number[][]): number {
  const avgLat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
  const mLat = 111320;
  const mLon = 111320 * Math.cos(toRadians(avgLat));
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    area += x1 * mLon * y2 * mLat - x2 * mLon * y1 * mLat;
  }
  return Math.abs(area) / 2 / 10000;
}

function vincentyM(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const a = 6378137, f = 1 / 298.257223563, b = (1 - f) * a;
  const phi1 = toRadians(lat1), phi2 = toRadians(lat2), L = toRadians(lon2 - lon1);
  const U1 = Math.atan((1 - f) * Math.tan(phi1)), U2 = Math.atan((1 - f) * Math.tan(phi2));
  const sU1 = Math.sin(U1), cU1 = Math.cos(U1), sU2 = Math.sin(U2), cU2 = Math.cos(U2);
  let lam = L, lamPrev = 0, sS = 0, cS = 0, sig = 0, sA = 0, c2A = 0, c2M = 0, iter = 0;
  while (Math.abs(lam - lamPrev) > 1e-12 && iter++ < 200) {
    const sL = Math.sin(lam), cL = Math.cos(lam);
    const t1 = cU2 * sL, t2 = cU1 * sU2 - sU1 * cU2 * cL;
    sS = Math.sqrt(t1 * t1 + t2 * t2);
    if (sS === 0) return 0;
    cS = sU1 * sU2 + cU1 * cU2 * cL;
    sig = Math.atan2(sS, cS);
    sA = (cU1 * cU2 * sL) / sS;
    c2A = 1 - sA * sA;
    c2M = c2A !== 0 ? cS - (2 * sU1 * sU2) / c2A : 0;
    const C = (f / 16) * c2A * (4 + f * (4 - 3 * c2A));
    lamPrev = lam;
    lam = L + (1 - C) * f * sA * (sig + C * sS * (c2M + C * cS * (-1 + 2 * c2M * c2M)));
  }
  if (iter >= 200) {
    const R = 6371008.8, dLat = toRadians(lat2 - lat1), dLon = toRadians(lon2 - lon1);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  const uSq = (c2A * (a * a - b * b)) / (b * b);
  const A2 = 1 + (uSq / 16384) * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  const B2 = (uSq / 1024) * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
  const dS = B2 * sS * (c2M + (B2 / 4) * (cS * (-1 + 2 * c2M ** 2) - (B2 / 6) * c2M * (-3 + 4 * sS ** 2) * (-3 + 4 * c2M ** 2)));
  return b * A2 * (sig - dS);
}

function buildRing(points: InputPoint[]): { ring: number[][]; errors: string[] } {
  const errors: string[] = [];
  const ring: number[][] = [];
  for (const p of points) {
    const lon = Number(p.x), lat = Number(p.y);
    if (!isValidLonLat(lon, lat)) {
      errors.push(`Invalid WGS84 coordinate: (${p.x}, ${p.y})`);
      continue;
    }
    ring.push([lon, lat]);
  }
  if (ring.length >= 3) {
    const [fx, fy] = ring[0], [lx, ly] = ring[ring.length - 1];
    if (fx !== lx || fy !== ly) ring.push([fx, fy]);
  }
  return { ring, errors };
}

function computeEdges(ring: number[][]): Array<{ meters: number; label: string }> {
  const edges = [];
  for (let i = 0; i < ring.length - 1; i++) {
    const m = vincentyM(ring[i][0], ring[i][1], ring[i + 1][0], ring[i + 1][1]);
    edges.push({ meters: m, label: `${m.toFixed(2)}m` });
  }
  return edges;
}

// ── ID generation (mirrors polygon-creator logic) ─────────────────────────────

async function generateUniqueId(
  admin: ReturnType<typeof createClient>,
  layerName: string,
): Promise<string> {
  const prefix = LAYER_PREFIX[layerName] ?? "SYNC";

  // Try DB RPC first
  const { data, error } = await admin.rpc("generate_polygon_unique_id", { layer_name: layerName });
  if (!error && data) return String(data);

  // Fallback: find max seq in polygon_features
  const { data: rows } = await admin
    .from("polygon_features")
    .select("unique_id")
    .eq("layer_name", layerName)
    .ilike("unique_id", `${prefix}-%`);

  let maxSeq = 0;
  const re = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-(\\d+)$`);
  for (const row of rows || []) {
    const m = String(row.unique_id || "").match(re);
    if (m) maxSeq = Math.max(maxSeq, Number(m[1]));
  }
  return `${prefix}-${String(maxSeq + 1).padStart(3, "0")}`;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function getAuthedUserId(
  req: Request,
  supabaseUrl: string,
  serviceRole: string,
): Promise<string | null> {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) return null;
  const { data, error } = await createClient(supabaseUrl, serviceRole).auth.getUser(token);
  if (error || !data?.user?.id) return null;
  return data.user.id;
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return fail(405, "Method not allowed");

  try {
    const body = await req.json();
    const action = String(body?.action || "");

    const supabaseUrl  = Deno.env.get("SUPABASE_URL");
    const serviceRole  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !serviceRole) return fail(500, "Missing env vars");

    const admin = createClient(supabaseUrl, serviceRole);

    // ── broadcast_polygon ──────────────────────────────────────────────────
    // NO authentication required – any plugin user can broadcast.
    if (action === "broadcast_polygon") {
      const layerName = String(body?.layerName || "");
      if (!ALLOWED_LAYERS.includes(layerName))
        return fail(400, `Invalid layerName. Allowed: ${ALLOWED_LAYERS.join(", ")}`);

      const points: InputPoint[] = Array.isArray(body?.points) ? body.points : [];
      if (points.length < 3) return fail(400, "At least 3 points required");

      const { ring, errors } = buildRing(points);
      if (errors.length > 0) return fail(400, `Coordinate errors: ${errors.join("; ")}`);
      if (ring.length < 4) return fail(400, "Not enough valid points");

      const area         = areaHectares(ring);
      const num_vertices = ring.length - 1;
      const edge_distances = computeEdges(ring);
      const geometry    = { type: "Polygon", coordinates: [ring] };

      // Broadcast via Supabase Realtime (no DB write)
      const realtimeClient = createClient(supabaseUrl, supabaseAnon ?? serviceRole);
      const channel = realtimeClient.channel("plugin-sync");

      await new Promise<void>((resolve) => {
        let resolved = false;
        const done = () => { if (!resolved) { resolved = true; resolve(); } };

        channel.subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel.send({
              type: "broadcast",
              event: "new_polygon",
              payload: { layerName, geometry, area_hectares: area, num_vertices, edge_distances },
            });
            done();
          }
        });
        setTimeout(done, 4000);
      });
      realtimeClient.removeChannel(channel);

      return ok({ broadcasted: true, area_hectares: area, num_vertices });
    }

    // ── save_polygon ───────────────────────────────────────────────────────
    // Auth IS required – only logged-in webmap users can save permanently.
    if (action === "save_polygon") {
      const userId = await getAuthedUserId(req, supabaseUrl, serviceRole);
      if (!userId) return fail(401, "Login required to save. Please log in on the webmap first.");

      const layerName = String(body?.layerName || "");
      if (!ALLOWED_LAYERS.includes(layerName))
        return fail(400, `Invalid layerName. Allowed: ${ALLOWED_LAYERS.join(", ")}`);

      const geometry = body?.geometry;
      if (!geometry?.coordinates?.[0]) return fail(400, "Missing geometry");

      const ring          = geometry.coordinates[0] as number[][];
      const area          = Number(body?.area_hectares ?? areaHectares(ring));
      const num_vertices  = Number(body?.num_vertices ?? ring.length - 1);
      const edge_distances = body?.edge_distances ?? computeEdges(ring);
      const formData      = body?.formData ?? {};
      const unique_id     = await generateUniqueId(admin, layerName);

      const row = {
        unique_id,
        layer_name:        layerName,
        geometry,
        area_hectares:     area,
        num_vertices,
        edge_distances,
        coordinate_system: "EPSG:4326",
        client:            formData.client         ?? null,
        project_name:      formData.projectName    ?? null,
        district:          formData.district       ?? null,
        county:            formData.county         ?? null,
        block_number:      formData.blockNumber    ?? null,
        plot_number:       formData.plotNumber     ?? null,
        surveyor:          formData.surveyor       ?? null,
        supervisor:        formData.supervisor     ?? null,
        company:           formData.company        ?? null,
        additional_info:   "Saved via plugin sync",
        created_by:        userId,
      };

      const { data, error } = await admin
        .from("polygon_features")
        .insert(row)
        .select("id, unique_id, layer_name, area_hectares")
        .single();

      if (error) return fail(500, `Save failed: ${error.message}`);
      return ok({ saved: true, row: data });
    }

    return fail(400, `Unknown action: ${action}. Use broadcast_polygon or save_polygon.`);

  } catch (err) {
    return fail(500, err instanceof Error ? err.message : "Unexpected error");
  }
});

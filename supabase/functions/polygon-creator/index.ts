import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

type InputPoint = {
  x: number;
  y: number;
  point_number?: string | number;
  description?: string;
};

type ParcelInput = {
  parcelId: string;
  points: InputPoint[];
};

type ParcelPreview = {
  parcelId: string;
  success: boolean;
  geometry?: {
    type: "Polygon";
    coordinates: number[][][];
  };
  area_hectares?: number;
  num_vertices?: number;
  edge_distances?: Array<{ meters: number; label: string }>;
  errors?: string[];
};

function fail(status: number, message: string, extra: Record<string, unknown> = {}) {
  return new Response(
    JSON.stringify({ success: false, error: message, ...extra }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

function ok(payload: Record<string, unknown>) {
  return new Response(
    JSON.stringify({ success: true, ...payload }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Vincenty inverse formula on WGS84 ellipsoid.
function vincentyDistanceMeters(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const a = 6378137.0;
  const f = 1 / 298.257223563;
  const b = (1 - f) * a;

  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const L = toRadians(lon2 - lon1);

  const U1 = Math.atan((1 - f) * Math.tan(phi1));
  const U2 = Math.atan((1 - f) * Math.tan(phi2));
  const sinU1 = Math.sin(U1);
  const cosU1 = Math.cos(U1);
  const sinU2 = Math.sin(U2);
  const cosU2 = Math.cos(U2);

  let lambda = L;
  let lambdaPrev = 0;
  let iter = 0;
  let sinSigma = 0;
  let cosSigma = 0;
  let sigma = 0;
  let sinAlpha = 0;
  let cosSqAlpha = 0;
  let cos2SigmaM = 0;

  while (Math.abs(lambda - lambdaPrev) > 1e-12 && iter < 200) {
    const sinLambda = Math.sin(lambda);
    const cosLambda = Math.cos(lambda);

    const t1 = cosU2 * sinLambda;
    const t2 = cosU1 * sinU2 - sinU1 * cosU2 * cosLambda;
    sinSigma = Math.sqrt(t1 * t1 + t2 * t2);
    if (sinSigma === 0) return 0;

    cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    sigma = Math.atan2(sinSigma, cosSigma);
    sinAlpha = (cosU1 * cosU2 * sinLambda) / sinSigma;
    cosSqAlpha = 1 - sinAlpha * sinAlpha;

    if (cosSqAlpha !== 0) {
      cos2SigmaM = cosSigma - (2 * sinU1 * sinU2) / cosSqAlpha;
    } else {
      cos2SigmaM = 0;
    }

    const C = (f / 16) * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
    lambdaPrev = lambda;
    lambda = L +
      (1 - C) * f * sinAlpha *
        (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
    iter++;
  }

  // Fallback for rare non-convergence cases.
  if (iter >= 200) {
    const R = 6371008.8;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const h = Math.sin(dLat / 2) ** 2 +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  const uSq = (cosSqAlpha * (a * a - b * b)) / (b * b);
  const A = 1 + (uSq / 16384) * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  const B = (uSq / 1024) * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
  const deltaSigma = B * sinSigma *
    (cos2SigmaM +
      (B / 4) *
        (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) -
          (B / 6) * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
  return b * A * (sigma - deltaSigma);
}

function areaHectares(coords: number[][]): number {
  // Project lon/lat to local meters using equirectangular approximation.
  const avgLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
  const mPerDegLat = 111320;
  const mPerDegLon = 111320 * Math.cos(toRadians(avgLat));
  let area = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const [x1, y1] = coords[i];
    const [x2, y2] = coords[i + 1];
    const X1 = x1 * mPerDegLon;
    const Y1 = y1 * mPerDegLat;
    const X2 = x2 * mPerDegLon;
    const Y2 = y2 * mPerDegLat;
    area += X1 * Y2 - X2 * Y1;
  }
  return Math.abs(area) / 2 / 10000;
}

function isValidLonLat(lon: number, lat: number): boolean {
  return Number.isFinite(lon) && Number.isFinite(lat) && lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90;
}

function segmentsIntersect(
  a1: number[],
  a2: number[],
  b1: number[],
  b2: number[],
): boolean {
  const orient = (p: number[], q: number[], r: number[]) =>
    Math.sign((q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]));
  const o1 = orient(a1, a2, b1);
  const o2 = orient(a1, a2, b2);
  const o3 = orient(b1, b2, a1);
  const o4 = orient(b1, b2, a2);
  return o1 !== o2 && o3 !== o4;
}

function hasSelfIntersection(ring: number[][]): boolean {
  // Ignore adjacent segments and first-last shared endpoint.
  for (let i = 0; i < ring.length - 1; i++) {
    const a1 = ring[i];
    const a2 = ring[i + 1];
    for (let j = i + 1; j < ring.length - 1; j++) {
      if (Math.abs(i - j) <= 1) continue;
      if (i === 0 && j === ring.length - 2) continue;
      const b1 = ring[j];
      const b2 = ring[j + 1];
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }
  return false;
}

function processParcel(parcelId: string, points: InputPoint[], skipSelfIntersectionCheck: boolean): ParcelPreview {
  const errors: string[] = [];
  if (!parcelId) errors.push("Missing parcelId");
  if (!Array.isArray(points) || points.length < 3) errors.push("At least 3 points are required");
  if (errors.length > 0) return { parcelId, success: false, errors };

  const ring: number[][] = [];
  for (const p of points) {
    const lon = Number(p.x);
    const lat = Number(p.y);
    if (!isValidLonLat(lon, lat)) {
      errors.push(`Invalid WGS84 coordinate: (${p.x}, ${p.y})`);
      continue;
    }
    ring.push([lon, lat]);
  }
  if (errors.length > 0) return { parcelId, success: false, errors };
  if (ring.length < 3) return { parcelId, success: false, errors: ["Not enough valid points"] };

  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push([first[0], first[1]]);

  if (!skipSelfIntersectionCheck && hasSelfIntersection(ring)) {
    return { parcelId, success: false, errors: ["Polygon has self-intersections"] };
  }

  const edge_distances = [];
  for (let i = 0; i < ring.length - 1; i++) {
    const [lon1, lat1] = ring[i];
    const [lon2, lat2] = ring[i + 1];
    const meters = vincentyDistanceMeters(lon1, lat1, lon2, lat2);
    edge_distances.push({ meters, label: `${meters.toFixed(2)}m` });
  }

  const area = areaHectares(ring);
  return {
    parcelId,
    success: true,
    geometry: { type: "Polygon", coordinates: [ring] },
    area_hectares: area,
    num_vertices: ring.length - 1,
    edge_distances,
  };
}

async function getAuthedUserId(req: Request, supabaseUrl: string, serviceRole: string): Promise<string | null> {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!token) return null;
  const admin = createClient(supabaseUrl, serviceRole);
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  return data.user.id;
}

async function generateUniqueIds(
  admin: ReturnType<typeof createClient>,
  layerName: string,
  count: number,
): Promise<string[]> {
  const prefix = LAYER_PREFIX[layerName] ?? "POLY";

  function parseSeq(id: string): number | null {
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const m = id.match(new RegExp(`^${escapedPrefix}-(\\d+)$`));
    if (!m) return null;
    const value = Number(m[1]);
    return Number.isFinite(value) ? value : null;
  }

  function formatId(seq: number): string {
    return `${prefix}-${String(seq).padStart(3, "0")}`;
  }

  const ids: string[] = [];
  const seen = new Set<string>();
  let rpcFailed = false;

  // Prefer existing DB RPC if available, to keep project's server-side numbering logic.
  for (let i = 0; i < count; i++) {
    const { data, error } = await admin.rpc("generate_polygon_unique_id", { layer_name: layerName });
    if (!error && data) {
      const candidate = String(data);
      const parsed = parseSeq(candidate);
      if (parsed === null) {
        rpcFailed = true;
        break;
      }
      const normalized = formatId(parsed);
      if (seen.has(normalized)) {
        rpcFailed = true;
        break;
      }
      ids.push(normalized);
      seen.add(normalized);
      continue;
    }
    rpcFailed = true;
    break;
  }

  if (!rpcFailed && ids.length === count) return ids;

  // Fallback: sequence from existing unique_id values in polygon_features.
  const { data: existingRows } = await admin
    .from("polygon_features")
    .select("unique_id")
    .eq("layer_name", layerName)
    .ilike("unique_id", `${prefix}-%`);

  let maxSeq = 0;
  for (const row of existingRows || []) {
    const seq = parseSeq(String(row.unique_id || ""));
    if (seq !== null && seq > maxSeq) maxSeq = seq;
  }

  // Include any IDs already generated above to avoid duplicates in this same request.
  for (const id of ids) {
    const seq = parseSeq(id);
    if (seq !== null && seq > maxSeq) maxSeq = seq;
  }

  while (ids.length < count) {
    maxSeq += 1;
    const id = formatId(maxSeq);
    if (!seen.has(id)) {
      ids.push(id);
      seen.add(id);
    }
  }

  return ids;
}

async function insertPolygonRowsWithRetry(
  admin: ReturnType<typeof createClient>,
  baseRows: Array<Record<string, unknown>>,
  layerName: string,
  maxAttempts = 4,
) {
  let lastError: { message?: string } | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const uniqueIds = await generateUniqueIds(admin, layerName, baseRows.length);
    const rows = baseRows.map((row, idx) => ({ ...row, unique_id: uniqueIds[idx] }));

    const { data, error } = await admin
      .from("polygon_features")
      .insert(rows)
      .select("id, unique_id, layer_name, area_hectares, plot_number");

    if (!error) {
      return { data: data || [], error: null };
    }

    lastError = error as { message?: string };
    const msg = String(error.message || "").toLowerCase();
    const isUniqueIdConflict = msg.includes("polygon_features_unique_id_key") ||
      (msg.includes("duplicate key") && msg.includes("unique_id"));

    if (!isUniqueIdConflict || attempt === maxAttempts) {
      return { data: null, error };
    }
  }

  return { data: null, error: lastError };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return fail(405, "Method not allowed");

  try {
    const body = await req.json();
    const action = body?.action || (Array.isArray(body?.points) ? "preview_single" : "preview_batch");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRole) return fail(500, "Missing Supabase environment variables");
    const admin = createClient(supabaseUrl, serviceRole);

    if (action === "preview_single") {
      const skip = !!body?.skipSelfIntersectionCheck;
      const result = processParcel("single", body?.points || [], skip);
      if (!result.success) {
        return new Response(JSON.stringify({ success: false, errors: result.errors || ["Validation failed"] }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return ok({
        geometry: result.geometry,
        area_hectares: result.area_hectares,
        num_vertices: result.num_vertices,
        edge_distances: result.edge_distances,
      });
    }

    if (action === "preview_batch") {
      const layerName = String(body?.layerName || "");
      if (!ALLOWED_LAYERS.includes(layerName)) {
        return fail(400, `Invalid layerName. Allowed: ${ALLOWED_LAYERS.join(", ")}`);
      }
      const parcels: ParcelInput[] = Array.isArray(body?.parcels) ? body.parcels : [];
      if (parcels.length === 0) return fail(400, "No parcels supplied");

      const skip = !!body?.skipSelfIntersectionCheck;
      const results = parcels.map((p) => processParcel(String(p.parcelId || ""), p.points || [], skip));
      const validCount = results.filter((r) => r.success).length;
      const failedCount = results.length - validCount;
      return ok({
        layerName,
        summary: { total: results.length, valid: validCount, failed: failedCount },
        results,
      });
    }

    if (action === "commit_batch") {
      const userId = await getAuthedUserId(req, supabaseUrl, serviceRole);
      if (!userId) return fail(401, "User not authenticated");

      const layerName = String(body?.layerName || "");
      if (!ALLOWED_LAYERS.includes(layerName)) {
        return fail(400, `Invalid layerName. Allowed: ${ALLOWED_LAYERS.join(", ")}`);
      }

      const parcels = Array.isArray(body?.parcels) ? body.parcels : [];
      if (parcels.length === 0) return fail(400, "No valid parcels to commit");

      const formData = body?.formData || {};
      const csvFileId = body?.csvFileId ?? null;
      const baseRows = parcels.map((p: Record<string, unknown>) => {
        const parcelId = String(p.parcelId || p.parcel_id || "");
        const formAdditional = formData.additionalInfo ? String(formData.additionalInfo) : "";
        const parcelTag = parcelId ? `CSV Parcel: ${parcelId}` : "CSV Parcel: N/A";
        return {
          layer_name: layerName,
          client: formData.client || null,
          project_name: formData.projectName || null,
          district: formData.district || null,
          county: formData.county || null,
          block_number: formData.blockNumber || null,
          plot_number: formData.plotNumber || parcelId || null,
          surveyor: formData.surveyor || null,
          supervisor: formData.supervisor || null,
          company: formData.company || null,
          coordinate_system: formData.coordinateSystem || "EPSG:4326",
          additional_info: [formAdditional, parcelTag].filter(Boolean).join(" | "),
          csv_file_id: csvFileId,
          geometry: p.geometry || null,
          area_hectares: Number(p.area_hectares || 0),
          num_vertices: Number(p.num_vertices || 0),
          edge_distances: p.edge_distances || null,
          created_by: userId,
        };
      });

      const { data, error } = await insertPolygonRowsWithRetry(admin, baseRows, layerName, 4);
      if (error) return fail(500, `Failed to save parcels: ${error.message}`);

      return ok({
        savedCount: data?.length || 0,
        failedCount: 0,
        savedRows: data || [],
      });
    }

    return fail(400, `Unsupported action: ${action}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return fail(500, message);
  }
});

/**
 * gspnet-sentinel-analytics
 * ─────────────────────────────────────────────────────────────────────────
 * GSP.NET Platform — Satellite Analytics Edge Function
 * Computes NDVI, NDMI (moisture), NDRE and NDWI time-series statistics
 * from the Copernicus Data Space Ecosystem (CDSE) Statistics API for any
 * user-defined Area of Interest (AOI) polygon.
 *
 * Required Supabase Secrets:
 *   SENTINEL_HUB_CLIENT_ID     — CDSE OAuth client id
 *   SENTINEL_HUB_CLIENT_SECRET — CDSE OAuth client secret
 *
 * Optional:
 *   SENTINEL_HUB_TOKEN_URL      — override token endpoint
 *   SENTINEL_HUB_STATISTICS_URL — override statistics API endpoint
 *
 * Payload (POST JSON):
 *   {
 *     "aoi":       GeoJSON Polygon | MultiPolygon (EPSG:4326),
 *     "date_from": "YYYY-MM-DD",
 *     "date_to":   "YYYY-MM-DD",
 *     "interval":  "P10D" | "P16D" | "P1M"  (default P16D)
 *   }
 */

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── CDSE Endpoints ───────────────────────────────────────────────────────────
const DEFAULT_TOKEN_URL =
  "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token";
const DEFAULT_STATISTICS_URL =
  "https://sh.dataspace.copernicus.eu/api/v1/statistics";

// ─── Token-Saving Limits ─────────────────────────────────────────────────────
const MAX_AREA_SQ_KM = 50;         // Hard cap: 50 km²
const MAX_DATE_RANGE_DAYS = 730;   // Max 2 years
const MIN_INTERVAL_DAYS = 10;      // Min 10-day intervals (P10D)

// ─── Evalscripts (SCL-masked for quality) ────────────────────────────────────

const EVAL_NDVI = `//VERSION=3
function setup(){
  return{input:[{bands:["B04","B08","SCL"]}],output:[{id:"default",sampleType:"FLOAT32",bands:1},{id:"dataMask",sampleType:"UINT8",bands:1}]};
}
function evaluatePixel(s){
  var c=s.SCL;
  if(c==0||c==1||c==3||c==8||c==9||c==10||c==11)return{default:[NaN],dataMask:[0]};
  var d=s.B08+s.B04;if(d==0)return{default:[NaN],dataMask:[0]};
  return{default:[(s.B08-s.B04)/d],dataMask:[1]};
}`;

const EVAL_NDMI = `//VERSION=3
function setup(){
  return{input:[{bands:["B8A","B11","SCL"]}],output:[{id:"default",sampleType:"FLOAT32",bands:1},{id:"dataMask",sampleType:"UINT8",bands:1}]};
}
function evaluatePixel(s){
  var c=s.SCL;
  if(c==0||c==1||c==3||c==8||c==9||c==10||c==11)return{default:[NaN],dataMask:[0]};
  var d=s.B8A+s.B11;if(d==0)return{default:[NaN],dataMask:[0]};
  return{default:[(s.B8A-s.B11)/d],dataMask:[1]};
}`;

const EVAL_NDRE = `//VERSION=3
function setup(){
  return{input:[{bands:["B05","B08","SCL"]}],output:[{id:"default",sampleType:"FLOAT32",bands:1},{id:"dataMask",sampleType:"UINT8",bands:1}]};
}
function evaluatePixel(s){
  var c=s.SCL;
  if(c==0||c==1||c==3||c==8||c==9||c==10||c==11)return{default:[NaN],dataMask:[0]};
  var d=s.B08+s.B05;if(d==0)return{default:[NaN],dataMask:[0]};
  return{default:[(s.B08-s.B05)/d],dataMask:[1]};
}`;

const EVAL_NDWI = `//VERSION=3
function setup(){
  return{input:[{bands:["B03","B08","SCL"]}],output:[{id:"default",sampleType:"FLOAT32",bands:1},{id:"dataMask",sampleType:"UINT8",bands:1}]};
}
function evaluatePixel(s){
  var c=s.SCL;
  if(c==0||c==1||c==3||c==8||c==9||c==10||c==11)return{default:[NaN],dataMask:[0]};
  var d=s.B03+s.B08;if(d==0)return{default:[NaN],dataMask:[0]};
  return{default:[(s.B03-s.B08)/d],dataMask:[1]};
}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fail(status: number, message: string, extra: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({ success: false, error: message, ...extra }), {
    status, headers: { ...cors, "Content-Type": "application/json" },
  });
}
function ok(payload: Record<string, unknown>) {
  return new Response(JSON.stringify({ success: true, ...payload }), {
    status: 200, headers: { ...cors, "Content-Type": "application/json" },
  });
}

/** Compute area of an EPSG:4326 polygon ring in km² (Shoelace + degree→km estimate). */
function ringSqKm(ring: number[][]): number {
  let area = 0;
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % n];
    area += x1 * y2 - x2 * y1;
  }
  const absArea = Math.abs(area) / 2;
  // 1° lat ≈ 111 km; use mean latitude for lon correction
  const meanLat = ring.reduce((s, c) => s + c[1], 0) / n;
  const kmPerLon = 111.320 * Math.cos((meanLat * Math.PI) / 180);
  const kmPerLat = 110.574;
  return absArea * kmPerLon * kmPerLat;
}

function computeAoiAreaSqKm(geo: { type: string; coordinates: unknown }): number {
  if (geo.type === "Polygon") {
    const ring = (geo.coordinates as number[][][])[0];
    return ringSqKm(ring);
  }
  if (geo.type === "MultiPolygon") {
    return (geo.coordinates as number[][][][]).reduce((sum, poly) => sum + ringSqKm(poly[0]), 0);
  }
  return 0;
}

function normalizeRing(coords: number[][]): number[][] {
  if (coords.length < 4) return coords;
  const first = coords[0], last = coords[coords.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return coords;
  return [...coords, [...first]];
}

function toPolygonGeometry(geo: { type: string; coordinates: unknown }): { type: "Polygon"; coordinates: number[][][] } {
  if (geo.type === "Polygon") {
    return { type: "Polygon", coordinates: (geo.coordinates as number[][][]).map(normalizeRing) };
  }
  if (geo.type === "MultiPolygon") {
    const first = (geo.coordinates as number[][][][])[0];
    return { type: "Polygon", coordinates: (first as number[][][]).map(normalizeRing) };
  }
  throw new Error("AOI must be a Polygon or MultiPolygon GeoJSON geometry.");
}

function daysBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 86400000;
}

function intervalDays(interval: string): number {
  const m = interval.match(/P(\d+)([DM])/i);
  if (!m) return 16;
  const n = parseInt(m[1]);
  return m[2].toUpperCase() === "M" ? n * 30 : n;
}

/** Auto-select resolution to save tokens based on area size. */
function chooseResolution(areaSqKm: number): number {
  if (areaSqKm > 20) return 60;
  if (areaSqKm > 5) return 30;
  return 20;
}

/** Deep-search for numeric mean in CDSE Statistics output. */
function extractMean(node: unknown): number | null {
  if (node == null) return null;
  if (typeof node === "object" && !Array.isArray(node)) {
    const o = node as Record<string, unknown>;
    if (typeof o.mean === "number" && Number.isFinite(o.mean)) return o.mean;
    if (o.stats && typeof (o.stats as Record<string, unknown>).mean === "number") {
      const st = o.stats as { mean: number };
      if (Number.isFinite(st.mean)) return st.mean;
    }
    for (const v of Object.values(o)) { const m = extractMean(v); if (m != null) return m; }
  }
  if (Array.isArray(node)) { for (const v of node) { const m = extractMean(v); if (m != null) return m; } }
  return null;
}

type IntervalRow = { from: string; to: string; mean: number | null };

function parseIntervals(json: unknown): IntervalRow[] {
  const root = json as { data?: unknown[]; results?: unknown[]; aggregations?: unknown[] };
  const data = root?.data ?? root?.results ?? root?.aggregations;
  if (!Array.isArray(data)) return [];
  return data.map((item) => {
    const row = item as { interval?: { from?: string; to?: string }; outputs?: unknown };
    return {
      from: String(row?.interval?.from ?? ""),
      to: String(row?.interval?.to ?? ""),
      mean: extractMean(row?.outputs),
    };
  });
}

async function getAccessToken(clientId: string, clientSecret: string, tokenUrl: string): Promise<string> {
  const body = new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret });
  const res = await fetch(tokenUrl, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() });
  const text = await res.text();
  if (!res.ok) throw new Error(`Token ${res.status}: ${text.slice(0, 300)}`);
  const j = JSON.parse(text) as { access_token?: string };
  if (!j.access_token) throw new Error("No access_token in CDSE response");
  return j.access_token;
}

async function postStats(
  token: string,
  geometry: { type: "Polygon"; coordinates: number[][][] },
  from: string,
  to: string,
  evalscript: string,
  interval: string,
  resolution: number,
  statsUrl: string
): Promise<unknown> {
  const body = {
    input: {
      bounds: {
        properties: { crs: "http://www.opengis.net/def/crs/OGC/1.3/CRS84" },
        geometry: { type: "Polygon" as const, coordinates: geometry.coordinates },
      },
      data: [{ type: "sentinel-2-l2a", dataFilter: { maxCloudCoverage: 60 } }],
    },
    aggregation: {
      timeRange: { from: from.includes("T") ? from : `${from}T00:00:00.000Z`, to: to.includes("T") ? to : `${to}T23:59:59.000Z` },
      aggregationInterval: { of: interval },
      resx: resolution, resy: resolution,
      evalscript,
    },
  };
  const res = await fetch(statsUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Stats API ${res.status}: ${text.slice(0, 600)}`);
  return JSON.parse(text);
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return fail(405, "Method not allowed");

  // ── Parse payload ──
  let payload: { aoi?: unknown; date_from?: string; date_to?: string; interval?: string };
  try { payload = await req.json(); }
  catch { return fail(400, "Invalid JSON body"); }

  const { aoi, date_from, date_to, interval = "P16D" } = payload;
  if (!aoi || !date_from || !date_to) {
    return fail(400, "aoi (GeoJSON Polygon/MultiPolygon), date_from and date_to are required.");
  }

  // ── Validate geometry ──
  const geo = aoi as { type: string; coordinates: unknown };
  if (!["Polygon", "MultiPolygon"].includes(geo.type)) {
    return fail(400, "aoi.type must be Polygon or MultiPolygon.");
  }

  // ── Enforce area limit ──
  const areaSqKm = computeAoiAreaSqKm(geo);
  if (areaSqKm > MAX_AREA_SQ_KM) {
    return fail(400, `AOI area (${areaSqKm.toFixed(1)} km²) exceeds the ${MAX_AREA_SQ_KM} km² maximum. Please draw a smaller area.`, { area_sq_km: areaSqKm });
  }

  // ── Enforce date range ──
  const rangeDays = daysBetween(date_from, date_to);
  if (rangeDays > MAX_DATE_RANGE_DAYS) {
    return fail(400, `Date range (${Math.round(rangeDays)} days) exceeds the ${MAX_DATE_RANGE_DAYS}-day maximum.`);
  }
  if (rangeDays < 1) return fail(400, "date_to must be after date_from.");

  // ── Enforce minimum interval ──
  if (intervalDays(interval) < MIN_INTERVAL_DAYS) {
    return fail(400, `Minimum interval is P${MIN_INTERVAL_DAYS}D (10 days) to conserve API tokens.`);
  }

  // ── CDSE credentials ──
  const clientId = Deno.env.get("SENTINEL_HUB_CLIENT_ID");
  const clientSecret = Deno.env.get("SENTINEL_HUB_CLIENT_SECRET");
  if (!clientId || !clientSecret) return fail(500, "SENTINEL_HUB_CLIENT_ID / SENTINEL_HUB_CLIENT_SECRET not configured.");

  const tokenUrl = Deno.env.get("SENTINEL_HUB_TOKEN_URL") || DEFAULT_TOKEN_URL;
  const statsUrl = Deno.env.get("SENTINEL_HUB_STATISTICS_URL") || DEFAULT_STATISTICS_URL;

  // ── Token ──
  let token: string;
  try { token = await getAccessToken(clientId, clientSecret, tokenUrl); }
  catch (e) { return fail(502, `CDSE auth failed: ${(e as Error).message}`); }

  // ── Geometry + auto-resolution ──
  let geometry: { type: "Polygon"; coordinates: number[][][] };
  try { geometry = toPolygonGeometry(geo); }
  catch (e) { return fail(400, (e as Error).message); }

  const resolution = chooseResolution(areaSqKm);

  // ── Fetch all indices in parallel ──
  let ndviRaw: unknown, ndmiRaw: unknown, ndreRaw: unknown, ndwiRaw: unknown;
  try {
    [ndviRaw, ndmiRaw, ndreRaw, ndwiRaw] = await Promise.all([
      postStats(token, geometry, date_from, date_to, EVAL_NDVI, interval, resolution, statsUrl),
      postStats(token, geometry, date_from, date_to, EVAL_NDMI, interval, resolution, statsUrl),
      postStats(token, geometry, date_from, date_to, EVAL_NDRE, interval, resolution, statsUrl),
      postStats(token, geometry, date_from, date_to, EVAL_NDWI, interval, resolution, statsUrl),
    ]);
  } catch (e) { return fail(502, `CDSE Statistics API error: ${(e as Error).message}`); }

  return ok({
    meta: {
      area_sq_km: parseFloat(areaSqKm.toFixed(3)),
      resolution_m: resolution,
      interval,
      date_from,
      date_to,
    },
    ndvi_intervals: parseIntervals(ndviRaw),
    ndmi_intervals: parseIntervals(ndmiRaw),
    ndre_intervals: parseIntervals(ndreRaw),
    ndwi_intervals: parseIntervals(ndwiRaw),
  });
});

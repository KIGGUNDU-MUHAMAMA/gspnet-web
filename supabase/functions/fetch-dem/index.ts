// supabase/functions/fetch-dem/index.ts
// DEM Fetch Proxy — tries COP30 → NASADEM → SRTMGL1 in priority order.
// The OpenTopography API key is stored as a Supabase secret (never exposed to browser).
//
// Deploy:
//   supabase secrets set OPENTOPO_API_KEY=c342cdcbfcc51049e55ab7c600b85abd
//   supabase functions deploy fetch-dem --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers":
    "X-DEM-Source, X-DEM-Source-Label, X-DEM-Area-Km2, X-DEM-Fallback",
};

/** DEM sources in priority order */
const DEM_SOURCES = [
  { type: "COP30",   label: "Copernicus DEM GLO-30 (best accuracy)" },
  { type: "NASADEM", label: "NASA DEM (SRTM-derived, improved)"      },
  { type: "SRTMGL1", label: "SRTM 1-Arc-Second (fallback)"           },
];

/** Compute approximate area in km² from a WGS84 bounding box */
function areakm2(minLat: number, maxLat: number, minLon: number, maxLon: number): number {
  const midLat = (minLat + maxLat) / 2;
  const wKm = (maxLon - minLon) * 111.32 * Math.cos((midLat * Math.PI) / 180);
  const hKm = (maxLat - minLat) * 110.574;
  return Math.abs(wKm * hKm);
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const API_KEY = Deno.env.get("OPENTOPO_API_KEY");
    if (!API_KEY) {
      return jsonError("Server configuration error: API key not set.", 500);
    }

    const body = await req.json();
    const { bbox, demtype } = body as {
      bbox: { minLat: number; maxLat: number; minLon: number; maxLon: number };
      demtype?: string;
    };

    // ── Validate bbox ──────────────────────────────────────────────────────
    const { minLat, maxLat, minLon, maxLon } = bbox;
    if (
      typeof minLat !== "number" || typeof maxLat !== "number" ||
      typeof minLon !== "number" || typeof maxLon !== "number" ||
      minLat >= maxLat || minLon >= maxLon
    ) {
      return jsonError("Invalid bounding box supplied.", 400);
    }

    const area = areakm2(minLat, maxLat, minLon, maxLon);

    // Hard cap — 25 km² keeps GeoTIFF manageable in browser
    if (area > 25) {
      return jsonError(
        `Area is ${area.toFixed(1)} km², which exceeds the 25 km² limit. ` +
        `Please draw a smaller extent on the map.`,
        400
      );
    }

    // ── Build source priority list ──────────────────────────────────────────
    // If caller requested a specific type, try it first, then fall through.
    const requested = demtype
      ? DEM_SOURCES.find((s) => s.type === demtype)
      : null;
    const orderedSources = requested
      ? [requested, ...DEM_SOURCES.filter((s) => s.type !== demtype)]
      : DEM_SOURCES;

    const triedSources: string[] = [];
    let usedSource: (typeof DEM_SOURCES)[0] | null = null;

    // ── Attempt each source ────────────────────────────────────────────────
    for (const source of orderedSources) {
      triedSources.push(source.label);
      const url =
        `https://portal.opentopography.org/API/globaldem` +
        `?demtype=${source.type}` +
        `&south=${minLat}&north=${maxLat}&west=${minLon}&east=${maxLon}` +
        `&outputFormat=GTiff&API_Key=${API_KEY}`;

      try {
        const r = await fetch(url, {
          signal: AbortSignal.timeout(30_000), // 30-second timeout per source
        });

        if (r.ok) {
          const isFallback = source.type !== (demtype ?? "COP30");
          const buf = await r.arrayBuffer();

          return new Response(buf, {
            headers: {
              ...CORS_HEADERS,
              "Content-Type": "image/tiff",
              "X-DEM-Source":       source.type,
              "X-DEM-Source-Label": source.label,
              "X-DEM-Area-Km2":     area.toFixed(2),
              "X-DEM-Fallback":     isFallback ? "true" : "false",
              "X-DEM-Tried":        triedSources.join(" | "),
            },
          });
        }

        console.warn(`[fetch-dem] ${source.type} returned HTTP ${r.status}`);
      } catch (err) {
        console.error(`[fetch-dem] ${source.type} fetch error:`, err);
      }
    }

    // ── All OpenTopography sources exhausted ───────────────────────────────
    // Instruct client to fall back to OpenTopoData point-sampling.
    return new Response(
      JSON.stringify({
        error: "all_sources_unavailable",
        tried: triedSources,
        message:
          "All OpenTopography DEM sources are currently unavailable. " +
          "Switching to OpenTopoData point-sampling (slower but free).",
        fallback: "opentopodata",
      }),
      {
        status: 503,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonError(`Unexpected server error: ${msg}`, 500);
  }
});

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

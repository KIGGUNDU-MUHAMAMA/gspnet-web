/**
 * GSP.NET — Mapillary Upload Proxy Worker
 * Cloudflare Worker that proxies ZIP uploads to Mapillary's
 * rupload.facebook.com resumable-upload infrastructure.
 *
 * Correct 3-step Mapillary v4 upload flow:
 *   Step 1 — GET  rupload.facebook.com/mapillary_public_uploads/{sessionKey}  → get offset
 *   Step 2 — POST rupload.facebook.com/mapillary_public_uploads/{sessionKey}  → upload ZIP
 *   Step 3 — POST graph.mapillary.com/finish_upload                            → publish sequence
 *
 * Client sends:
 *   POST /upload
 *   Headers:
 *     X-Session-Key : <uuid string — becomes the zip filename>
 *     X-File-Name   : <uuid.zip>
 *     X-File-Size   : <total bytes as string>
 *     Content-Type  : application/zip
 *   Body: raw ZIP binary
 */

const CORS_HEADERS = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Key, X-File-Name, X-File-Size',
};

const RUPLOAD_BASE = 'https://rupload.facebook.com/mapillary_public_uploads';
const FINISH_URL   = 'https://graph.mapillary.com/finish_upload';

export default {
    async fetch(request, env, ctx) {

        // ── CORS preflight ────────────────────────────────────────
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: CORS_HEADERS });
        }

        const url = new URL(request.url);

        // ── Health check ──────────────────────────────────────────
        if (url.pathname === '/' || url.pathname === '') {
            return new Response(
                JSON.stringify({ status: 'Mapillary Upload Proxy is running' }),
                { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
            );
        }

        // ── Upload endpoint ───────────────────────────────────────
        if (url.pathname === '/upload' && request.method === 'POST') {
            try {
                // Guard: token must be configured
                if (!env.MAPILLARY_TOKEN) {
                    throw new Error('MAPILLARY_TOKEN secret is not configured on this worker. Run: npx wrangler secret put MAPILLARY_TOKEN');
                }

                // Read session metadata from headers
                const sessionKey = request.headers.get('X-Session-Key');
                const fileName   = request.headers.get('X-File-Name') || `${sessionKey}.zip`;
                const fileSizeHdr = request.headers.get('X-File-Size');

                if (!sessionKey) {
                    throw new Error('Missing required header: X-Session-Key');
                }

                // Buffer the ZIP (max ~60 MB for 30 × 2 MB images + overhead)
                const fileBuffer = await request.arrayBuffer();
                if (fileBuffer.byteLength === 0) {
                    throw new Error('Received empty ZIP body — no images to upload');
                }
                const fileSize = fileSizeHdr ? parseInt(fileSizeHdr, 10) : fileBuffer.byteLength;

                const uploadUrl = `${RUPLOAD_BASE}/${sessionKey}`;
                const authHeader = `OAuth ${env.MAPILLARY_TOKEN}`;

                // ── Step 1: Get current upload offset ────────────
                // Allows resuming interrupted uploads from where they left off.
                let offset = 0;
                try {
                    const offsetResp = await fetch(uploadUrl, {
                        method: 'GET',
                        headers: { 'Authorization': authHeader },
                    });
                    if (offsetResp.ok) {
                        const offsetData = await offsetResp.json().catch(() => ({}));
                        offset = typeof offsetData.offset === 'number' ? offsetData.offset : 0;
                    }
                    // 404 = brand new session → offset stays 0
                } catch (_) {
                    // Network hiccup on GET is non-fatal — start from 0
                    offset = 0;
                }

                // ── Step 2: Upload the ZIP ────────────────────────
                const uploadResp = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization':   authHeader,
                        'X-Entity-Length': fileSize.toString(),
                        'X-Entity-Name':   fileName,
                        'X-Entity-Type':   'application/zip',
                        'Offset':          offset.toString(),
                        'Content-Length':  fileBuffer.byteLength.toString(),
                    },
                    body: fileBuffer,
                });

                if (!uploadResp.ok) {
                    const errBody = await uploadResp.text().catch(() => '(no body)');
                    throw new Error(`Mapillary ZIP upload failed [${uploadResp.status}]: ${errBody}`);
                }

                // ── Step 3: Finish / publish the sequence ─────────
                // Without this call the images remain in Mapillary's staging
                // buffer and are never processed or shown on the map.
                const finishResp = await fetch(FINISH_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': authHeader,
                        'Content-Type':  'application/json',
                    },
                    body: JSON.stringify({ session_key: sessionKey }),
                });

                if (!finishResp.ok) {
                    const errBody = await finishResp.text().catch(() => '(no body)');
                    throw new Error(`Mapillary finish_upload failed [${finishResp.status}]: ${errBody}`);
                }

                const finishData = await finishResp.json().catch(() => ({}));

                return new Response(JSON.stringify({
                    success:    true,
                    sessionKey,
                    message:    'Images uploaded and published to Mapillary successfully',
                    finishData,
                }), {
                    status:  200,
                    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
                });

            } catch (error) {
                console.error('[Mapillary Proxy] Error:', error.message);
                return new Response(JSON.stringify({
                    success: false,
                    error:   error.message,
                }), {
                    status:  500,
                    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
                });
            }
        }

        // ── Catch-all ─────────────────────────────────────────────
        return new Response(JSON.stringify({ error: 'Not found' }), {
            status:  404,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
    },
};

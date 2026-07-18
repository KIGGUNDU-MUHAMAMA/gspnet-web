/**
 * GSP.NET — Parcel Case Collaboration Worker
 * Handles:
 *   POST /upload        → Returns a pre-signed R2 PUT URL
 *   GET  /download/:key → Pre-signs R2 GET URL for a file
 *   GET  /ws/:caseId    → Upgrades to WebSocket (Durable Object room)
 *   POST /ai            → Proxies prompt to Workers AI (llama-3-8b-instruct)
 *
 * Deploy with: npx wrangler deploy  (from /cloudflare-worker directory)
 */

const ALLOWED_ORIGINS = [
    'https://kiggundu-muhamama.github.io',
    'https://geospatialnetworkug.xyz',
    'http://localhost',
    'http://127.0.0.1'
];

function corsHeaders(origin) {
    const allowed = ALLOWED_ORIGINS.find(o => origin && origin.startsWith(o))
        ? origin
        : ALLOWED_ORIGINS[0];
    return {
        'Access-Control-Allow-Origin': allowed,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Case-Id',
        'Access-Control-Max-Age': '86400'
    };
}

function json(data, status = 200, origin = '*') {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
    });
}

// ─── MAIN WORKER ─────────────────────────────────────────────────────────────
export default {
    async fetch(request, env, ctx) {
        const origin = request.headers.get('Origin') || '';
        const url    = new URL(request.url);
        const path   = url.pathname;

        // Pre-flight CORS
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders(origin) });
        }

        try {
            // ── 1. R2 Direct Upload URL ──────────────────────────────────────
            if (path.startsWith('/upload/') && request.method === 'PUT') {
                const parts = path.split('/'); // ['', 'upload', caseId, fileName]
                const caseId = parts[2];
                const fileName = decodeURIComponent(parts.slice(3).join('/'));
                if (!caseId || !fileName) {
                    return json({ error: 'caseId and fileName required in URL' }, 400, origin);
                }
                const key = `cases/${caseId}/${Date.now()}_${fileName}`;
                
                await env.CASE_FILES.put(key, request.body, {
                    httpMetadata: { contentType: request.headers.get('Content-Type') || 'application/octet-stream' }
                });
                return json({ key }, 200, origin);
            }

            // ── 2. R2 Direct Download URL ────────────────────────────────────
            if (path.startsWith('/download/') && request.method === 'GET') {
                const key = decodeURIComponent(path.replace('/download/', ''));
                const object = await env.CASE_FILES.get(key);
                
                if (!object) {
                    return json({ error: 'File not found' }, 404, origin);
                }
                
                const headers = new Headers();
                object.writeHttpMetadata(headers);
                headers.set('etag', object.httpEtag);
                
                // Ensure CORS headers are attached to the file response
                const cors = corsHeaders(origin);
                for (const [k, v] of Object.entries(cors)) headers.set(k, v);
                
                return new Response(object.body, { headers });
            }

            // ── 3. WebSocket → Durable Object Room ───────────────────────────
            // (Disabled for Zero-Cost Edition: we use Supabase Realtime instead)
            if (path.startsWith('/ws/') && request.headers.get('Upgrade') === 'websocket') {
                return json({ error: 'WebSockets disabled in Zero-Cost edition' }, 403, origin);
            }

            // ── 4. Workers AI Case Assistant ─────────────────────────────────
            if (path === '/ai' && request.method === 'POST') {
                const { prompt, caseContext } = await request.json();
                if (!prompt) return json({ error: 'prompt required' }, 400, origin);

                const systemPrompt = `You are a professional geospatial quality control assistant for Uganda's land registry system (GSP.NET).
You help surveyors, RSU officers, physical planners, and district staff resolve parcel flag cases.
Be concise, professional, and practical. Reference Ugandan land laws when applicable (Land Act Cap 227, Registration of Titles Act).
${caseContext ? `\n\nCurrent Case:\n${caseContext}` : ''}`;

                const aiResponse = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user',   content: prompt }
                    ],
                    max_tokens: 512
                });

                return json({
                    response: aiResponse.response || aiResponse.result?.response || 'No response from AI.'
                }, 200, origin);
            }

            return json({ error: 'Not found', path }, 404, origin);

        } catch (err) {
            console.error('[Worker Error]', err);
            return json({ error: err.message || 'Internal error' }, 500, origin);
        }
    }
};



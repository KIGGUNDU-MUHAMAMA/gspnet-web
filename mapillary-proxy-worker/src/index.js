const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Adjust in production to your domain
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
    async fetch(request, env, ctx) {
        // Handle CORS preflight requests
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeaders,
            });
        }

        const url = new URL(request.url);

        if (url.pathname === '/upload' && request.method === 'POST') {
            try {
                if (!env.MAPILLARY_TOKEN) {
                    throw new Error("MAPILLARY_TOKEN secret is not set in the worker.");
                }

                // 1. Initialize Mapillary Upload Session
                const sessionResponse = await fetch(`https://graph.mapillary.com/uploads?access_token=${env.MAPILLARY_TOKEN}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ type: 'zip' })
                });

                if (!sessionResponse.ok) {
                    const errText = await sessionResponse.text();
                    throw new Error(`Failed to create Mapillary session: ${sessionResponse.status} ${errText}`);
                }

                const sessionData = await sessionResponse.json();
                const uploadUrl = sessionData.url;
                const uploadId = sessionData.id;

                // 2. Stream the ZIP file directly to the upload URL
                const fileBuffer = await request.arrayBuffer();
                
                const uploadResponse = await fetch(uploadUrl, {
                    method: 'PUT', // Mapillary typically expects PUT to the uploadUrl
                    headers: {
                        'Authorization': `OAuth ${env.MAPILLARY_TOKEN}`,
                        'Content-Type': 'application/zip',
                        'Content-Length': fileBuffer.byteLength.toString(),
                    },
                    body: fileBuffer
                });

                if (!uploadResponse.ok) {
                    const errText = await uploadResponse.text();
                    throw new Error(`Failed to upload to Mapillary URL: ${uploadResponse.status} ${errText}`);
                }

                // Mapillary upload session closure is typically automatic upon successful file processing, 
                // but if Mapillary V4 requires explicit close via Graph API, it's done below:
                // (Note: Currently the direct mapillary_tools upload approach using rupload.facebook.com doesn't explicitly close via graph, it just succeeds. We'll return success.)

                return new Response(JSON.stringify({ 
                    success: true, 
                    uploadId: uploadId,
                    message: "Successfully proxy-uploaded to Mapillary"
                }), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            } catch (error) {
                return new Response(JSON.stringify({ success: false, error: error.message }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        // Default response for other routes
        return new Response('Mapillary Upload Proxy Worker is running.', {
            status: 200,
            headers: corsHeaders
        });
    }
};

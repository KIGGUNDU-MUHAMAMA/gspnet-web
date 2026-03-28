/**
 * Cloudflare Worker for Gemini API Proxy
 * 
 * Instructions for deployment:
 * 1. Go to your Cloudflare Dashboard -> Workers & Pages
 * 2. Create a new Worker (e.g. named `gspnet-gemini-bot`)
 * 3. Copy and paste this code into the worker.
 * 4. Go to the Worker's Settings -> Variables & Secrets.
 * 5. Add a new Secret named `GEMINI_API_KEY` and paste your Google AI Studio free-tier key.
 * 6. Deploy the worker and copy its URL.
 * 7. Update the `GEMINI_WORKER_URL` in `webmap.html` with your new worker URL.
 */

export default {
    async fetch(request, env, ctx) {
      // 1. Handle CORS Preflight (OPTIONS)
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*", // Or specify your domain: "https://geospatialnetworkug.xyz"
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }
  
      // 2. Only allow POST requests
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
      }
  
      // 3. Ensure API Key is configured
      if (!env.GEMINI_API_KEY) {
        return new Response(
          JSON.stringify({ error: "Gemini API key not configured in Worker secrets." }),
          { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
        );
      }
  
      try {
        // 4. Parse incoming payload (from webmap.html)
        const requestData = await request.json();
  
        // 5. Forward request to Gemini API
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
        
        const geminiResponse = await fetch(geminiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData)
        });
  
        // 6. Return response back to frontend
        const data = await geminiResponse.json();
        
        return new Response(JSON.stringify(data), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          status: geminiResponse.status,
        });
  
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    },
  };

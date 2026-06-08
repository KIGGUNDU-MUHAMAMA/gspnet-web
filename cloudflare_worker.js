import { connect } from 'cloudflare:sockets';

export default {
  async fetch(request, env, ctx) {
    // 1. Handle CORS Preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*"
        }
      });
    }

    const url = new URL(request.url);
    const host = url.searchParams.get("host");
    const port = parseInt(url.searchParams.get("port") || "2101");

    if (!host) {
      return new Response("Missing 'host' query parameter", { status: 400 });
    }

    // 2. Reject non-WebSocket requests
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response("Expected WebSocket connection. This is a TCP-to-WebSocket proxy.", { status: 426 });
    }

    // 3. Setup WebSocket pair for the browser
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    server.accept();

    // 4. Establish a raw TCP socket to the NTRIP caster (e.g. SurvNet)
    let tcpSocket;
    try {
      tcpSocket = connect({ hostname: host, port: port });
    } catch (err) {
      server.close(1011, "TCP connect failed");
      return new Response(null, { status: 101, webSocket: client });
    }

    // 5. Forward data from TCP (NTRIP) to WebSocket (Browser)
    ctx.waitUntil(
      tcpSocket.readable.pipeTo(new WritableStream({
        write(chunk) {
          try {
            server.send(chunk);
          } catch(e) {
            // connection dropped
          }
        }
      })).catch(() => {
        try { server.close(); } catch(e){}
      })
    );

    // 6. Forward data from WebSocket (Browser) to TCP (NTRIP)
    server.addEventListener('message', event => {
      try {
        const writer = tcpSocket.writable.getWriter();
        writer.write(event.data);
        writer.releaseLock();
      } catch (err) {
        // TCP socket closed or error
      }
    });

    server.addEventListener('close', () => {
      try { tcpSocket.close(); } catch(e){}
    });

    server.addEventListener('error', () => {
      try { tcpSocket.close(); } catch(e){}
    });

    // 7. Return the WebSocket upgrade response to the browser
    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }
};

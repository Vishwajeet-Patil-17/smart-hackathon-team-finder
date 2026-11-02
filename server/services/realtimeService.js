import { WebSocketServer, WebSocket } from 'ws';

let wss = null;
const clients = new Set();

/**
 * Initialize WebSocket Server attached to the shared HTTP server
 */
export function initRealtime(httpServer) {
  wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws, req) => {
    clients.add(ws);

    // Initial handshake ping
    try {
      ws.send(JSON.stringify({ type: 'connected', message: 'Smart Hackathon Realtime Active' }));
    } catch {
      // ignore
    }

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        }
      } catch (e) {
        // ignore non-json
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', (err) => {
      console.warn('[Realtime WS Client Warning]:', err.message);
      clients.delete(ws);
    });
  });

  console.log('[Realtime] WebSocket server initialized on shared HTTP port.');
}

/**
 * Broadcast an event to all connected clients
 */
export function broadcastEvent(event, payload = {}) {
  if (!wss) return;
  const message = JSON.stringify({
    event,
    payload,
    timestamp: new Date().toISOString(),
  });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (err) {
        clients.delete(client);
      }
    }
  }
}

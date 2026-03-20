/**
 * Custom Next.js server with WebSocket support.
 *
 * This replaces `next start` to add WebSocket handling for the bridge protocol.
 */

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer } from "ws";
import { handleWebSocket } from "./lib/ws-bridge/server/handler";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "localhost";
const port = parseInt(process.env.PORT ?? "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "", true);
    handle(req, res, parsedUrl);
  });

  // WebSocket server on /api/ws/download
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const { pathname } = parse(request.url ?? "");

    if (pathname === "/api/ws/download") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", (ws, request) => {
    // Extract client IP for rate limiting
    const forwarded = request.headers["x-forwarded-for"];
    const clientIp =
      (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]) ??
      request.socket.remoteAddress ??
      "unknown";

    handleWebSocket(ws, clientIp);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket bridge enabled at ws://${hostname}:${port}/api/ws/download`);
  });
});

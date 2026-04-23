// server.js — servidor estático para o painel admin de eventos no Railway
// Usa o módulo 'serve' programaticamente para garantir que process.env.PORT seja lido corretamente

import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const DIST = join(__dirname, "dist");
const PORT = parseInt(process.env.PORT || "3000", 10);

const MIME = {
  ".html": "text/html",
  ".js":   "application/javascript",
  ".css":  "text/css",
  ".json": "application/json",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf":  "font/ttf",
  ".webp": "image/webp",
};

const server = createServer((req, res) => {
  // Remove query string
  const urlPath = req.url.split("?")[0];
  let filePath = join(DIST, urlPath);

  // If path is a directory or file doesn't exist → serve index.html (SPA fallback)
  if (!existsSync(filePath) || filePath === DIST || filePath.endsWith("/")) {
    filePath = join(DIST, "index.html");
  }

  const ext = extname(filePath).toLowerCase();
  const contentType = MIME[ext] || "application/octet-stream";

  try {
    const content = readFileSync(filePath);
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000",
    });
    res.end(content);
  } catch {
    // Fallback to index.html for any read error (SPA routing)
    try {
      const index = readFileSync(join(DIST, "index.html"));
      res.writeHead(200, { "Content-Type": "text/html", "Cache-Control": "no-cache" });
      res.end(index);
    } catch {
      res.writeHead(500);
      res.end("Internal Server Error");
    }
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[eventos-admin] Servidor rodando na porta ${PORT}`);
});

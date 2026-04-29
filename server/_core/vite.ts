import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Use process.cwd() para Railway (build roda na raiz do projeto)
  // Use import.meta.dirname para desenvolvimento (tsx watch)
  const basePath = process.env.NODE_ENV === "production" ? process.cwd() : path.resolve(import.meta.dirname, "../..");
  const distPath = path.resolve(basePath, "dist", "public");
  console.log(`[serveStatic] Serving static files from: ${distPath} (NODE_ENV=${process.env.NODE_ENV}, basePath=${basePath})`);
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Serve arquivos estáticos - não passa para o próximo middleware se não encontrar
  app.use(express.static(distPath, { 
    dotfiles: 'ignore',
    index: false // Não serve index.html automaticamente
  }));

  // SPA fallback: apenas para rotas que não são arquivos estáticos
  app.use("*", (req, res, next) => {
    // Se for uma requisição de arquivo (tem extensão), não serve index.html
    const hasExtension = /\.[^\/]+$/.test(req.originalUrl);
    if (hasExtension) {
      return res.status(404).send("Not found");
    }

    const indexPath = path.resolve(distPath, "index.html");
    
    // Verifica se index.html existe
    if (!fs.existsSync(indexPath)) {
      console.error(`[serveStatic] index.html not found at: ${indexPath}`);
      return res.status(500).send("Application not built");
    }

    console.log(`[serveStatic] Serving index.html for SPA route: ${req.originalUrl}`);
    res.sendFile(indexPath, (err) => {
      if (err && !res.headersSent) {
        console.error(`[serveStatic] Error serving index.html:`, err);
        res.status(500).send("Error loading application");
      }
    });
  });
}

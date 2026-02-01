import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerGoogleOAuthRoutes } from "./googleOAuth";
import { registerLocalAuthRoutes } from "./localAuth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeWebSocket } from "./websocket";
import { startCrons } from "./crons";
import { detectCompanyByDomain } from "./domainMiddleware";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.use(detectCompanyByDomain);
  registerStripeWebhook(app);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerGoogleOAuthRoutes(app);
  // Local auth routes (email/password)
  registerLocalAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Inicializar WebSocket
  initializeWebSocket(server);

  startCrons();

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

function registerStripeWebhook(app: express.Express) {
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: express.Request, res: express.Response) => {
      const sig = req.headers["stripe-signature"] as string;
      if (!sig) {
        res.status(400).send("Missing stripe-signature");
        return;
      }
      try {
        const { constructWebhookEvent } = await import("./stripeService.js");
        const rawBody = (req as unknown as { body: Buffer }).body;
        const event = constructWebhookEvent(rawBody, sig);
        const db = await import("../db.js").then((m) => m.getDb());
        if (!db) {
          res.status(500).send("Database not available");
          return;
        }
        const { subscriptions } = await import("../../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        const e = event as { type: string; data?: { object?: { client_reference_id?: string } } };
        if (e.type === "checkout.session.completed" && e.data?.object?.client_reference_id) {
          const companyId = parseInt(e.data.object.client_reference_id, 10);
          const plan = (e.data.object as { metadata?: { plan?: string } }).metadata?.plan ?? "pro";
          const limit = plan === "premium" ? 20000 : 5000;
          await db.update(subscriptions).set({
            planType: plan === "premium" ? "premium" : "basico",
            status: "active",
            messagesLimit: limit,
            updatedAt: new Date(),
          }).where(eq(subscriptions.companyId, companyId));
        }
        res.status(200).send();
      } catch (err) {
        console.warn("[Stripe] Webhook error:", err);
        res.status(400).send("Webhook error");
      }
    }
  );
}

startServer().catch(console.error);

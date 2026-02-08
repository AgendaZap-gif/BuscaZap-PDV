import "dotenv/config";
import path from "path";
import express from "express";
import cors from "cors";
import eventosRouter from "./routes/eventos.js";
import adminAuthRouter from "./routes/admin.js";
import eventosAdminRouter from "./routes/eventos-admin.js";
import expositorRouter from "./routes/expositor.js";

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Arquivos enviados pelo painel (banner/mapa dos eventos)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// API pública (app)
app.use("/eventos", eventosRouter);

// Painel admin: login + CRUD eventos/expositores (JWT)
app.use("/admin", adminAuthRouter);
app.use("/admin", eventosAdminRouter);

// Área do expositor: login + edição das próprias imagens (JWT expositor)
app.use("/expositor", expositorRouter);

app.get("/health", (_, res) => {
  res.json({ ok: true, service: "eventos-service" });
});

app.listen(PORT, () => {
  console.log(`Eventos service running on port ${PORT}`);
});

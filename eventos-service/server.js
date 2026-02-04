import "dotenv/config";
import express from "express";
import cors from "cors";
import eventosRouter from "./routes/eventos.js";
import adminAuthRouter from "./routes/admin.js";
import eventosAdminRouter from "./routes/eventos-admin.js";

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// API pública (app)
app.use("/eventos", eventosRouter);

// Painel admin: login + CRUD eventos/expositores (JWT)
app.use("/admin", adminAuthRouter);
app.use("/admin", eventosAdminRouter);

app.get("/health", (_, res) => {
  res.json({ ok: true, service: "eventos-service" });
});

app.listen(PORT, () => {
  console.log(`Eventos service running on port ${PORT}`);
});

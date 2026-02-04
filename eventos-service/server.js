import "dotenv/config";
import express from "express";
import cors from "cors";
import eventosRouter from "./routes/eventos.js";

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.use("/eventos", eventosRouter);

app.get("/health", (_, res) => {
  res.json({ ok: true, service: "eventos-service" });
});

app.listen(PORT, () => {
  console.log(`Eventos service running on port ${PORT}`);
});

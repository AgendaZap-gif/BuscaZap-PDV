import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import { requireExpositor, JWT_SECRET } from "../middleware/auth.js";

const router = Router();
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "eventos");
for (const sub of ["expositor-logo", "expositor-titulo", "expositor-banner"]) {
  const dir = path.join(UPLOAD_DIR, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getBaseUrl(req) {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, "");
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.headers["x-forwarded-host"] || req.get("host") || "localhost:3002";
  return `${proto}://${host}`;
}

function makeUpload(tipo) {
  const dir = path.join(UPLOAD_DIR, tipo);
  const storage = multer.diskStorage({
    destination: (_, __, cb) => cb(null, dir),
    filename: (_, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  });
  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_, file, cb) => cb(null, /^image\//.test(file.mimetype)),
  }).single("file");
}

// POST /expositor/login - login do expositor (painel eventos-admin)
router.post("/login", async (req, res) => {
  try {
    const { login, senha } = req.body || {};
    if (!login?.trim() || !senha) {
      return res.status(400).json({ error: "Login e senha obrigatórios" });
    }
    const [rows] = await pool.query(
      "SELECT id, evento_id AS eventoId, nome, login, senha FROM expositores WHERE login = ?",
      [login.trim().toLowerCase()]
    );
    if (!rows.length) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }
    const exp = rows[0];
    if (!exp.senha) {
      return res.status(401).json({ error: "Este expositor ainda não tem senha definida. Peça ao administrador do evento para definir login e senha." });
    }
    const ok = await bcrypt.compare(senha, exp.senha);
    if (!ok) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }
    const token = jwt.sign(
      { tipo: "expositor", expositorId: exp.id, eventoId: exp.eventoId, nome: exp.nome },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      token,
      expositor: { id: exp.id, eventoId: exp.eventoId, nome: exp.nome },
    });
  } catch (err) {
    console.error("POST /expositor/login", err);
    res.status(500).json({ error: "Erro ao fazer login" });
  }
});

// GET /expositor/me - dados do expositor logado
router.get("/me", requireExpositor, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.id, e.evento_id AS eventoId, e.nome, e.logo_url AS logoUrl, e.imagem_titulo_url AS imagemTituloUrl, e.banner_url AS bannerUrl, e.patrocinado
       FROM expositores e WHERE e.id = ?`,
      [req.expositor.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Expositor não encontrado" });
    res.json(rows[0]);
  } catch (err) {
    console.error("GET /expositor/me", err);
    res.status(500).json({ error: "Erro ao buscar dados" });
  }
});

// PUT /expositor/me - atualizar apenas imagens (logo, título, banner se patrocinado). Só atualiza campos enviados.
router.put("/me", requireExpositor, async (req, res) => {
  try {
    const { logoUrl, imagemTituloUrl, bannerUrl } = req.body || {};
    const id = req.expositor.id;
    const [current] = await pool.query("SELECT logo_url, imagem_titulo_url, banner_url, patrocinado FROM expositores WHERE id = ?", [id]);
    if (!current.length) return res.status(404).json({ error: "Expositor não encontrado" });
    const c = current[0];
    const patrocinado = Boolean(c.patrocinado);
    const setLogo = logoUrl !== undefined;
    const setTitulo = imagemTituloUrl !== undefined;
    const setBanner = patrocinado && bannerUrl !== undefined;
    const parts = [];
    const values = [];
    if (setLogo) { parts.push("logo_url = ?"); values.push(logoUrl || null); }
    if (setTitulo) { parts.push("imagem_titulo_url = ?"); values.push(imagemTituloUrl || null); }
    if (setBanner) { parts.push("banner_url = ?"); values.push(bannerUrl || null); }
    if (parts.length === 0) {
      const [rows] = await pool.query(
        `SELECT e.id, e.evento_id AS eventoId, e.nome, e.logo_url AS logoUrl, e.imagem_titulo_url AS imagemTituloUrl, e.banner_url AS bannerUrl, e.patrocinado FROM expositores e WHERE e.id = ?`,
        [id]
      );
      return res.json(rows[0]);
    }
    values.push(id);
    await pool.query(`UPDATE expositores SET ${parts.join(", ")} WHERE id = ?`, values);
    const [rows] = await pool.query(
      `SELECT e.id, e.evento_id AS eventoId, e.nome, e.logo_url AS logoUrl, e.imagem_titulo_url AS imagemTituloUrl, e.banner_url AS bannerUrl, e.patrocinado FROM expositores e WHERE e.id = ?`,
      [id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error("PUT /expositor/me", err);
    res.status(500).json({ error: "Erro ao atualizar" });
  }
});

// POST /expositor/upload - upload de imagem (logo, titulo ou banner). query: tipo=logo|titulo|banner
router.post("/upload", requireExpositor, (req, res, next) => {
  const tipo = (req.query?.tipo || "logo").toString().toLowerCase();
  const map = { logo: "expositor-logo", titulo: "expositor-titulo", banner: "expositor-banner" };
  const dirTipo = map[tipo] || "expositor-logo";
  const upload = makeUpload(dirTipo);
  upload(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error: "Arquivo muito grande (máx. 10MB)" });
      return res.status(400).json({ error: err.message || "Erro no upload" });
    }
    if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado" });
    const rel = `eventos/${dirTipo}/${req.file.filename}`;
    const url = `${getBaseUrl(req)}/uploads/${rel}`;
    res.json({ url });
  });
});

export default router;

import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import pool from "../db.js";
import { requireAdmin, requireMaster, requireEventoAccess } from "../middleware/auth.js";

const router = Router();
router.use(requireAdmin);

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "eventos");
for (const sub of ["banner", "mapa", "expositor-logo", "expositor-titulo", "expositor-banner"]) {
  const dir = path.join(UPLOAD_DIR, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
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

function getBaseUrl(req) {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, "");
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.headers["x-forwarded-host"] || req.get("host") || "localhost:3002";
  return `${proto}://${host}`;
}

// POST /admin/eventos/upload - upload de imagem; query: tipo=banner|mapa|expositor-logo|expositor-titulo|expositor-banner; body: file. Retorna { url }
router.post("/eventos/upload", (req, res, next) => {
  const tipo = (req.query?.tipo || "banner").toString().toLowerCase();
  const allowed = ["banner", "mapa", "expositor-logo", "expositor-titulo", "expositor-banner"];
  const dirTipo = allowed.includes(tipo) ? tipo : "banner";
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

// GET /admin/eventos - listar todos (master) ou só o evento do produtor
router.get("/eventos", async (req, res) => {
  try {
    if (req.admin.role === "master") {
      const [rows] = await pool.query(
        `SELECT id, nome, cidade, banner_url AS bannerUrl, mapa_url AS mapaUrl, mapa_largura AS mapaLargura, mapa_altura AS mapaAltura, ativo, data_inicio AS dataInicio, data_fim AS dataFim, created_at AS createdAt
         FROM eventos ORDER BY data_inicio DESC`
      );
      return res.json(rows);
    }
    if (req.admin.eventoId) {
      const [rows] = await pool.query(
        `SELECT id, nome, cidade, banner_url AS bannerUrl, mapa_url AS mapaUrl, mapa_largura AS mapaLargura, mapa_altura AS mapaAltura, ativo, data_inicio AS dataInicio, data_fim AS dataFim, created_at AS createdAt
         FROM eventos WHERE id = ?`,
        [req.admin.eventoId]
      );
      return res.json(rows);
    }
    return res.json([]);
  } catch (err) {
    console.error("GET /admin/eventos", err);
    res.status(500).json({ error: "Erro ao listar eventos" });
  }
});

// POST /admin/eventos - criar evento (só master)
router.post("/eventos", requireMaster, async (req, res) => {
  try {
    const {
      nome,
      cidade,
      bannerUrl,
      mapaUrl,
      mapaLargura,
      mapaAltura,
      ativo,
      dataInicio,
      dataFim,
      latitude,
      longitude,
    } = req.body || {};
    if (!nome?.trim() || !cidade?.trim() || !dataInicio || !dataFim) {
      return res.status(400).json({ error: "Nome, cidade, data início e data fim obrigatórios" });
    }
    const [result] = await pool.query(
      `INSERT INTO eventos (nome, cidade, banner_url, mapa_url, mapa_largura, mapa_altura, latitude, longitude, ativo, data_inicio, data_fim)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nome.trim(),
        cidade.trim(),
        bannerUrl || null,
        mapaUrl || null,
        mapaLargura ?? 800,
        mapaAltura ?? 600,
        latitude ?? null,
        longitude ?? null,
        ativo !== false ? 1 : 0,
        dataInicio,
        dataFim,
      ]
    );
    const [rows] = await pool.query(
      "SELECT id, nome, cidade, banner_url AS bannerUrl, mapa_url AS mapaUrl, mapa_largura AS mapaLargura, mapa_altura AS mapaAltura, ativo, data_inicio AS dataInicio, data_fim AS dataFim, created_at AS createdAt FROM eventos WHERE id = ?",
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("POST /admin/eventos", err);
    res.status(500).json({ error: "Erro ao criar evento" });
  }
});

// GET /admin/eventos/:id
router.get("/eventos/:id", requireEventoAccess, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [rows] = await pool.query(
      `SELECT id, nome, cidade, banner_url AS bannerUrl, mapa_url AS mapaUrl, mapa_largura AS mapaLargura, mapa_altura AS mapaAltura, latitude, longitude, ativo, data_inicio AS dataInicio, data_fim AS dataFim, created_at AS createdAt FROM eventos WHERE id = ?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: "Evento não encontrado" });
    res.json(rows[0]);
  } catch (err) {
    console.error("GET /admin/eventos/:id", err);
    res.status(500).json({ error: "Erro ao buscar evento" });
  }
});

// PUT /admin/eventos/:id
router.put("/eventos/:id", requireEventoAccess, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const {
      nome,
      cidade,
      bannerUrl,
      mapaUrl,
      mapaLargura,
      mapaAltura,
      ativo,
      dataInicio,
      dataFim,
      latitude,
      longitude,
    } = req.body || {};
    await pool.query(
      `UPDATE eventos SET nome = ?, cidade = ?, banner_url = ?, mapa_url = ?, mapa_largura = ?, mapa_altura = ?, latitude = ?, longitude = ?, ativo = ?, data_inicio = ?, data_fim = ? WHERE id = ?`,
      [
        nome ?? "",
        cidade ?? "",
        bannerUrl ?? null,
        mapaUrl ?? null,
        mapaLargura ?? 800,
        mapaAltura ?? 600,
        latitude ?? null,
        longitude ?? null,
        ativo !== false ? 1 : 0,
        dataInicio,
        dataFim,
        id,
      ]
    );
    const [rows] = await pool.query(
      "SELECT id, nome, cidade, banner_url AS bannerUrl, mapa_url AS mapaUrl, mapa_largura AS mapaLargura, mapa_altura AS mapaAltura, ativo, data_inicio AS dataInicio, data_fim AS dataFim FROM eventos WHERE id = ?",
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: "Evento não encontrado" });
    res.json(rows[0]);
  } catch (err) {
    console.error("PUT /admin/eventos/:id", err);
    res.status(500).json({ error: "Erro ao atualizar evento" });
  }
});

// PATCH /admin/eventos/:id/ativo - toggle ativo
router.patch("/eventos/:id/ativo", requireEventoAccess, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { ativo } = req.body ?? {};
    const v = ativo !== false ? 1 : 0;
    await pool.query("UPDATE eventos SET ativo = ? WHERE id = ?", [v, id]);
    const [rows] = await pool.query("SELECT id, ativo FROM eventos WHERE id = ?", [id]);
    if (!rows.length) return res.status(404).json({ error: "Evento não encontrado" });
    res.json({ ativo: Boolean(rows[0].ativo) });
  } catch (err) {
    console.error("PATCH /admin/eventos/:id/ativo", err);
    res.status(500).json({ error: "Erro ao atualizar evento" });
  }
});

// Helper: get categoria id by name (create if not exists)
async function getOrCreateCategoriaId(nome) {
  if (!nome?.trim()) return null;
  const [ex] = await pool.query("SELECT id FROM categorias WHERE nome = ?", [nome.trim()]);
  if (ex.length) return ex[0].id;
  const [ins] = await pool.query("INSERT INTO categorias (nome) VALUES (?)", [nome.trim()]);
  return ins.insertId;
}

// GET /admin/eventos/:id/expositores
router.get("/eventos/:id/expositores", requireEventoAccess, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [rows] = await pool.query(
      `SELECT e.id, e.evento_id AS eventoId, e.categoria_id AS categoriaId, c.nome AS categoria, e.nome, e.whatsapp, e.estande, e.promocao, e.destaque, e.patrocinado, e.pos_x AS posX, e.pos_y AS posY,
        e.logo_url AS logoUrl, e.imagem_titulo_url AS imagemTituloUrl, e.banner_url AS bannerUrl, e.login
       FROM expositores e LEFT JOIN categorias c ON c.id = e.categoria_id WHERE e.evento_id = ? ORDER BY e.nome ASC`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /admin/eventos/:id/expositores", err);
    res.status(500).json({ error: "Erro ao listar expositores" });
  }
});

// POST /admin/eventos/:id/expositores
router.post("/eventos/:id/expositores", requireEventoAccess, async (req, res) => {
  try {
    const eventoId = parseInt(req.params.id, 10);
    const { nome, categoria, whatsapp, estande, promocao, destaque, patrocinado, posX, posY, logoUrl, imagemTituloUrl, bannerUrl, login, senha } = req.body || {};
    if (!nome?.trim()) return res.status(400).json({ error: "Nome obrigatório" });
    const categoriaId = await getOrCreateCategoriaId(categoria);
    let senhaHash = null;
    if (login?.trim() && senha) {
      senhaHash = await bcrypt.hash(senha, 10);
    }
    const [result] = await pool.query(
      `INSERT INTO expositores (evento_id, categoria_id, nome, whatsapp, estande, promocao, destaque, patrocinado, pos_x, pos_y, logo_url, imagem_titulo_url, banner_url, login, senha)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventoId,
        categoriaId,
        nome.trim(),
        whatsapp?.trim() || null,
        estande?.trim() || null,
        promocao?.trim() || null,
        destaque ? 1 : 0,
        patrocinado ? 1 : 0,
        posX ?? 0,
        posY ?? 0,
        logoUrl || null,
        imagemTituloUrl || null,
        bannerUrl || null,
        login?.trim()?.toLowerCase() || null,
        senhaHash,
      ]
    );
    const [rows] = await pool.query(
      `SELECT e.id, e.evento_id AS eventoId, e.categoria_id AS categoriaId, c.nome AS categoria, e.nome, e.whatsapp, e.estande, e.promocao, e.destaque, e.patrocinado, e.pos_x AS posX, e.pos_y AS posY, e.logo_url AS logoUrl, e.imagem_titulo_url AS imagemTituloUrl, e.banner_url AS bannerUrl, e.login
       FROM expositores e LEFT JOIN categorias c ON c.id = e.categoria_id WHERE e.id = ?`,
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ error: "Este login já está em uso por outro expositor." });
    console.error("POST /admin/eventos/:id/expositores", err);
    res.status(500).json({ error: "Erro ao criar expositor" });
  }
});

// PUT /admin/expositores/:id
router.put("/expositores/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [existentes] = await pool.query("SELECT evento_id FROM expositores WHERE id = ?", [id]);
    if (!existentes.length) return res.status(404).json({ error: "Expositor não encontrado" });
    const eventoId = existentes[0].evento_id;
    if (req.admin.role !== "master" && req.admin.eventoId !== eventoId) {
      return res.status(403).json({ error: "Sem permissão" });
    }
    const { nome, categoria, whatsapp, estande, promocao, destaque, patrocinado, posX, posY, logoUrl, imagemTituloUrl, bannerUrl, login, senha } = req.body || {};
    const categoriaId = await getOrCreateCategoriaId(categoria);
    let updates = "categoria_id = ?, nome = ?, whatsapp = ?, estande = ?, promocao = ?, destaque = ?, patrocinado = ?, pos_x = ?, pos_y = ?, logo_url = ?, imagem_titulo_url = ?, banner_url = ?";
    const values = [
      categoriaId,
      nome ?? "",
      whatsapp ?? null,
      estande ?? null,
      promocao ?? null,
      destaque ? 1 : 0,
      patrocinado ? 1 : 0,
      posX ?? 0,
      posY ?? 0,
      logoUrl ?? null,
      imagemTituloUrl ?? null,
      bannerUrl ?? null,
    ];
    if (login !== undefined) {
      updates += ", login = ?";
      values.push(login?.trim()?.toLowerCase() || null);
    }
    if (senha !== undefined && senha !== "" && senha != null) {
      const senhaHash = await bcrypt.hash(senha, 10);
      updates += ", senha = ?";
      values.push(senhaHash);
    }
    values.push(id);
    await pool.query(`UPDATE expositores SET ${updates} WHERE id = ?`, values);
    const [rows] = await pool.query(
      `SELECT e.id, e.evento_id AS eventoId, e.categoria_id AS categoriaId, c.nome AS categoria, e.nome, e.whatsapp, e.estande, e.promocao, e.destaque, e.patrocinado, e.pos_x AS posX, e.pos_y AS posY, e.logo_url AS logoUrl, e.imagem_titulo_url AS imagemTituloUrl, e.banner_url AS bannerUrl, e.login
       FROM expositores e LEFT JOIN categorias c ON c.id = e.categoria_id WHERE e.id = ?`,
      [id]
    );
    res.json(rows[0]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ error: "Este login já está em uso por outro expositor." });
    console.error("PUT /admin/expositores/:id", err);
    res.status(500).json({ error: "Erro ao atualizar expositor" });
  }
});

// DELETE /admin/expositores/:id
router.delete("/expositores/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [existentes] = await pool.query("SELECT evento_id FROM expositores WHERE id = ?", [id]);
    if (!existentes.length) return res.status(404).json({ error: "Expositor não encontrado" });
    const eventoId = existentes[0].evento_id;
    if (req.admin.role !== "master" && req.admin.eventoId !== eventoId) {
      return res.status(403).json({ error: "Sem permissão" });
    }
    await pool.query("DELETE FROM expositores WHERE id = ?", [id]);
    res.status(204).send();
  } catch (err) {
    console.error("DELETE /admin/expositores/:id", err);
    res.status(500).json({ error: "Erro ao excluir expositor" });
  }
});

export default router;

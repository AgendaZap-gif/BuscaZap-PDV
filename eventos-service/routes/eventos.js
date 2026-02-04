import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET /eventos/ativos?cidade=Primavera do Leste
// Somente eventos ativos (ativo=true, hoje entre data_inicio e data_fim), filtrados por cidade
router.get("/ativos", async (req, res) => {
  try {
    const cidade = req.query.cidade?.trim();
    if (!cidade) {
      return res.json([]);
    }
    const [rows] = await pool.query(
      `SELECT id, nome, cidade, banner_url AS bannerUrl, mapa_url AS mapaUrl, mapa_largura AS mapaLargura, mapa_altura AS mapaAltura, latitude, longitude, data_inicio AS dataInicio, data_fim AS dataFim
       FROM eventos
       WHERE cidade = ?
         AND ativo = true
         AND CURDATE() BETWEEN data_inicio AND data_fim
       ORDER BY data_inicio ASC`,
      [cidade]
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /eventos/ativos", err);
    res.status(500).json({ error: "Erro ao listar eventos ativos" });
  }
});

// GET /eventos/:id - detalhes do evento
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }
    const [rows] = await pool.query(
      `SELECT id, nome, cidade, banner_url AS bannerUrl, mapa_url AS mapaUrl, mapa_largura AS mapaLargura, mapa_altura AS mapaAltura, latitude, longitude, ativo, data_inicio AS dataInicio, data_fim AS dataFim, created_at AS createdAt
       FROM eventos WHERE id = ?`,
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("GET /eventos/:id", err);
    res.status(500).json({ error: "Erro ao buscar evento" });
  }
});

// GET /eventos/:id/expositores - lista expositores (patrocinados e destaques primeiro)
router.get("/:id/expositores", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }
    const [rows] = await pool.query(
      `SELECT e.id, e.evento_id AS eventoId, e.categoria_id AS categoriaId, c.nome AS categoria,
        e.nome, e.whatsapp, e.estande, e.promocao, e.destaque, e.patrocinado, e.pos_x AS posX, e.pos_y AS posY
       FROM expositores e
       LEFT JOIN categorias c ON c.id = e.categoria_id
       WHERE e.evento_id = ?
       ORDER BY e.patrocinado DESC, e.destaque DESC, e.nome ASC`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /eventos/:id/expositores", err);
    res.status(500).json({ error: "Erro ao listar expositores" });
  }
});

// GET /eventos/:id/promocoes - somente expositores com promocao
router.get("/:id/promocoes", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }
    const [rows] = await pool.query(
      `SELECT e.id, e.evento_id AS eventoId, e.categoria_id AS categoriaId, c.nome AS categoria,
        e.nome, e.whatsapp, e.estande, e.promocao, e.destaque, e.patrocinado, e.pos_x AS posX, e.pos_y AS posY
       FROM expositores e
       LEFT JOIN categorias c ON c.id = e.categoria_id
       WHERE e.evento_id = ? AND e.promocao IS NOT NULL AND e.promocao != ''
       ORDER BY e.patrocinado DESC, e.destaque DESC, e.nome ASC`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /eventos/:id/promocoes", err);
    res.status(500).json({ error: "Erro ao listar promoções" });
  }
});

// GET /eventos/:id/mapa - dados do mapa (url + dimensões)
router.get("/:id/mapa", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }
    const [rows] = await pool.query(
      `SELECT mapa_url AS mapaUrl, mapa_largura AS largura, mapa_altura AS altura FROM eventos WHERE id = ?`,
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("GET /eventos/:id/mapa", err);
    res.status(500).json({ error: "Erro ao buscar mapa" });
  }
});

export default router;

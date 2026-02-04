import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import { JWT_SECRET } from "../middleware/auth.js";

const router = Router();

// POST /admin/login - { email, senha } => { token, admin: { id, email, role, eventoId } }
router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body || {};
    if (!email?.trim() || !senha) {
      return res.status(400).json({ error: "Email e senha obrigatórios" });
    }
    const [rows] = await pool.query(
      "SELECT id, email, senha, role, evento_id AS eventoId FROM admins WHERE email = ?",
      [email.trim().toLowerCase()]
    );
    if (!rows.length) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }
    const admin = rows[0];
    const ok = await bcrypt.compare(senha, admin.senha);
    if (!ok) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        eventoId: admin.eventoId,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        eventoId: admin.eventoId,
      },
    });
  } catch (err) {
    console.error("POST /admin/login", err);
    res.status(500).json({ error: "Erro ao fazer login" });
  }
});

export default router;

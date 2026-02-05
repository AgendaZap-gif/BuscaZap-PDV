/**
 * Cria login de secretaria para teste no painel eventos-admin.
 * Uso: node scripts/create-secretaria-teste.js
 * Ou: node scripts/create-secretaria-teste.js outro@email.com outra_senha 2
 *   (email, senha, evento_id)
 *
 * Credenciais padrão: secretaria@teste.com / teste123
 * role: produtor (acessa apenas o evento vinculado; evento_id = 1 por padrão)
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import pool from "../db.js";

const [email = "secretaria@teste.com", senha = "teste123", eventoIdStr] = process.argv.slice(2);
const eventoId = eventoIdStr ? parseInt(eventoIdStr, 10) : 1;

const hash = await bcrypt.hash(senha, 10);

try {
  await pool.query(
    "INSERT INTO admins (email, senha, role, evento_id) VALUES (?, ?, 'produtor', ?)",
    [email.trim().toLowerCase(), hash, isNaN(eventoId) ? null : eventoId]
  );
  console.log("Secretaria (teste) criada com sucesso.");
  console.log("  Email:", email.trim().toLowerCase());
  console.log("  Senha:", senha);
  console.log("  Role: produtor (acesso ao evento_id " + (eventoId || "—") + ")");
  console.log("  Acesse o painel eventos-admin e faça login com essas credenciais.");
} catch (e) {
  if (e.code === "ER_DUP_ENTRY") {
    console.error("Este email já está cadastrado. Use outro email ou altere a senha manualmente no banco.");
  } else {
    console.error(e.message || e);
  }
  process.exit(1);
}
process.exit(0);

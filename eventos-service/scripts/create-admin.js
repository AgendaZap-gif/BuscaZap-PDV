/**
 * Cria primeiro admin (master).
 * Uso: node scripts/create-admin.js email@exemplo.com senha123
 * Ou: node scripts/create-admin.js email@exemplo.com senha123 produtor 5
 *   (role produtor vinculado ao evento_id 5)
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import pool from "../db.js";

const [email, senha, role = "master", eventoId] = process.argv.slice(2);
if (!email || !senha) {
  console.error("Uso: node scripts/create-admin.js <email> <senha> [role] [evento_id]");
  process.exit(1);
}

const hash = await bcrypt.hash(senha, 10);
const roleVal = role === "produtor" ? "produtor" : "master";
const evId = eventoId ? parseInt(eventoId, 10) : null;

try {
  await pool.query(
    "INSERT INTO admins (email, senha, role, evento_id) VALUES (?, ?, ?, ?)",
    [email.trim().toLowerCase(), hash, roleVal, evId]
  );
  console.log("Admin criado:", email, "role:", roleVal, evId ? "evento_id " + evId : "");
} catch (e) {
  if (e.code === "ER_DUP_ENTRY") {
    console.error("Email já cadastrado.");
  } else {
    console.error(e);
  }
  process.exit(1);
}
process.exit(0);

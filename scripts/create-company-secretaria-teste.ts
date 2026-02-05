/**
 * Cria empresa de teste no banco do PDV para login em /admin/login (secretaria@teste.com / teste123).
 * Uso: pnpm run create-company-secretaria-teste
 * Ou: pnpm exec tsx scripts/create-company-secretaria-teste.ts outro@email.com outra_senha "Nome"
 *
 * Requer: .env com DATABASE_URL (banco do PDV).
 * Se a tabela companies não tiver passwordHash/referralCode/engagementScore, o script tenta adicionar.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

const email = process.argv[2] || "secretaria@teste.com";
const senha = process.argv[3] || "teste123";
const name = process.argv[4] || "Secretaria Teste";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Defina DATABASE_URL no .env (banco do PDV).");
  process.exit(1);
}

async function tableHasColumn(conn: mysql.Connection, table: string, column: string): Promise<boolean> {
  const [rows] = await conn.execute<{ COLUMN_NAME: string }[]>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
    [table, column]
  );
  const arr = Array.isArray(rows) ? rows : [];
  return arr.length > 0;
}

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);
  const passwordHash = await bcrypt.hash(senha, 10);
  const slug = "secretaria-teste-" + nanoid(6);
  const referralCode = nanoid(8);
  const emailNorm = email.trim().toLowerCase();

  try {
    // 1) Garantir colunas de auth (MySQL não tem IF NOT EXISTS em ADD COLUMN; ignoramos "Duplicate column")
    const alterStatements = [
      "ALTER TABLE `companies` ADD COLUMN `passwordHash` TEXT",
      "ALTER TABLE `companies` ADD COLUMN `referralCode` VARCHAR(20) UNIQUE",
      "ALTER TABLE `companies` ADD COLUMN `engagementScore` INT NOT NULL DEFAULT 100",
      "ALTER TABLE `companies` ADD COLUMN `domain` VARCHAR(255)",
    ];
    for (const sql of alterStatements) {
      try {
        await conn.execute(sql);
      } catch (e: unknown) {
        const err = e as { code?: string; message?: string };
        if (err.code !== "ER_DUP_FIELDNAME" && !err.message?.includes("Duplicate column")) {
          throw e;
        }
      }
    }

    // 2) Resolver cityId se a tabela tiver essa coluna (obrigatória em alguns bancos)
    let cityId: number | null = 1;
    try {
      const [rows] = await conn.execute<{ id: number }[]>("SELECT id FROM cities ORDER BY id LIMIT 1");
      const arr = Array.isArray(rows) ? rows : [];
      if (arr.length > 0 && arr[0].id != null) cityId = arr[0].id;
    } catch {
      cityId = 1;
    }

    // 3) Inserir empresa (colunas base + auth; cityId se existir)
    const hasCityId = await tableHasColumn(conn, "companies", "cityId");
    if (hasCityId) {
      await conn.execute(
        `INSERT INTO companies (name, slug, email, isActive, passwordHash, referralCode, engagementScore, createdAt, updatedAt, cityId)
         VALUES (?, ?, ?, 1, ?, ?, 100, NOW(), NOW(), ?)`,
        [name, slug, emailNorm, passwordHash, referralCode, cityId ?? 1]
      );
    } else {
      await conn.execute(
        `INSERT INTO companies (name, slug, email, isActive, passwordHash, referralCode, engagementScore, createdAt, updatedAt)
         VALUES (?, ?, ?, 1, ?, ?, 100, NOW(), NOW())`,
        [name, slug, emailNorm, passwordHash, referralCode]
      );
    }

    console.log("Empresa de teste criada no PDV.");
    console.log("  Email:", emailNorm);
    console.log("  Senha:", senha);
    console.log("  Use em /admin/login ou /secretaria/agenda.");
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err.code === "ER_DUP_ENTRY" || err.message?.includes("Duplicate entry")) {
      console.error("Já existe uma empresa com este e-mail. Use outro ou altere a senha no banco.");
    } else {
      console.error("Erro:", err.message || e);
    }
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main();

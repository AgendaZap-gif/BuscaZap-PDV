#!/usr/bin/env node
/**
 * Gera SQL para criar usuário de secretária para teste no painel.
 *
 * USO: rode no TERMINAL (Node.js), NÃO no DBeaver:
 *   node scripts/gerar-sql-secretaria.js [email] [senha] [companyId]
 *
 * Exemplo:
 *   node scripts/gerar-sql-secretaria.js
 *   node scripts/gerar-sql-secretaria.js secretaria@teste.com senha123 1
 *
 * Depois copie a saída (só o SQL) e execute no DBeaver.
 */

const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const email = process.argv[2] || "secretaria@teste.com";
const senha = process.argv[3] || "senha123";
const companyId = process.argv[4] || "1";

const openId = `local_secretaria_${crypto.randomBytes(12).toString("hex")}`;
const passwordHash = bcrypt.hashSync(senha, 10);
const name = "Secretária Teste";

const sql = `-- Login de teste (gerado por gerar-sql-secretaria.js)
-- Email: ${email}
-- Senha: ${senha}
-- CompanyId: ${companyId}

DELETE FROM \`users\` WHERE \`email\` = '${email.replace(/'/g, "''")}';

INSERT INTO \`users\` (
  \`openId\`,
  \`name\`,
  \`email\`,
  \`password\`,
  \`loginMethod\`,
  \`role\`,
  \`companyId\`,
  \`createdAt\`,
  \`updatedAt\`,
  \`lastSignedIn\`
) VALUES (
  '${openId}',
  '${name}',
  '${email}',
  '${passwordHash}',
  'email',
  'admin',
  ${companyId},
  NOW(),
  NOW(),
  NOW()
);

SELECT id, openId, name, email, role, companyId FROM \`users\` WHERE email = '${email.replace(/'/g, "''")}';
`;

console.log(sql);

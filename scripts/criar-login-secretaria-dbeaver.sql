-- =============================================================================
-- Script: criar login de secretária para teste no painel (BuscaZap PDV)
-- Uso: executar APENAS ESTE ARQUIVO no DBeaver (abrir este .sql e rodar).
--      NÃO execute o arquivo gerar-sql-secretaria.js no DBeaver (ele é Node.js).
--
-- Credenciais de teste:
--   Email:  secretaria@teste.com
--   Senha:  senha123
--
-- Se der "Data truncated for column 'role'", descomente a linha abaixo
-- para ver os valores permitidos e troque 'admin' no INSERT por um deles:
-- SHOW COLUMNS FROM `users` LIKE 'role';
-- =============================================================================

SET @company_id = 1;

-- Role: use 'user' (sempre existe) ou 'admin' se o seu banco tiver.
-- Para ver os valores permitidos: SHOW COLUMNS FROM `users` LIKE 'role';
SET @role_secretaria = 'user';

DELETE FROM `users` WHERE `email` = 'secretaria@teste.com';

INSERT INTO `users` (
  `openId`,
  `name`,
  `email`,
  `password`,
  `loginMethod`,
  `role`,
  `companyId`,
  `createdAt`,
  `updatedAt`,
  `lastSignedIn`
) VALUES (
  CONCAT('local_secretaria_', REPLACE(UUID(), '-', '')),
  'Secretária Teste',
  'secretaria@teste.com',
  '$2b$10$uLU/2.TntSam/dIUzC6TIuDmfWe3QmKx4v75FV7v9OVu9zM/pJ6ay',
  'email',
  @role_secretaria,
  @company_id,
  NOW(),
  NOW(),
  NOW()
);

-- Confere o usuário criado
SELECT id, openId, name, email, role, companyId, createdAt
  FROM `users`
 WHERE email = 'secretaria@teste.com';

-- (Opcional) Se o seu banco tiver o valor 'admin' no enum de role e você quiser
-- perfil de administrador para este usuário, descomente e execute:
-- UPDATE `users` SET `role` = 'admin' WHERE `email` = 'secretaria@teste.com';

-- =============================================================================
-- Como usar no painel
-- =============================================================================
-- Email: secretaria@teste.com  |  Senha: senha123
-- Login por email (tela ou POST /api/auth/login).
-- =============================================================================

-- Migration v9: Adicionar campos de plano na tabela users
-- Data: 2025-01-09
-- Descrição: Adiciona campos planType e planExpiresAt para controlar acesso ao PDV

-- Verificar se a coluna planType já existe antes de adicionar
SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'planType'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE users ADD COLUMN planType VARCHAR(50) NULL COMMENT ''Tipo de plano: destaque, basico, etc''',
  'SELECT ''Column planType already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar se a coluna planExpiresAt já existe antes de adicionar
SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'planExpiresAt'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE users ADD COLUMN planExpiresAt TIMESTAMP NULL COMMENT ''Data de expiração do plano''',
  'SELECT ''Column planExpiresAt already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Atualizar admin@buscazap.com.br com plano destaque ativo (válido por 1 ano)
UPDATE users 
SET planType = 'destaque', 
    planExpiresAt = DATE_ADD(NOW(), INTERVAL 1 YEAR)
WHERE email = 'admin@buscazap.com.br';

SELECT 'Migration v9 completed successfully' AS status;

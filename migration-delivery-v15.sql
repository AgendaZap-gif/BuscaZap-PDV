-- Migration v15: deliveryType em delivery_requests (city vs company)
-- Aplicar no banco do Railway (mysql.railway.internal)

-- Adicionar coluna deliveryType somente se ainda não existir
SET @has_delivery_type = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'delivery_requests'
    AND COLUMN_NAME = 'deliveryType'
);

SET @alter_sql = IF(
  @has_delivery_type = 0,
  'ALTER TABLE delivery_requests ADD COLUMN deliveryType ENUM(''city'', ''company'') NOT NULL DEFAULT ''city'' AFTER deliveryFee',
  'SELECT ''Column deliveryType already exists'' AS message'
);

PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Índice opcional para consultas do pool global
SET @has_idx = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'delivery_requests'
    AND INDEX_NAME = 'idx_delivery_requests_pool'
);

SET @idx_sql = IF(
  @has_idx = 0,
  'CREATE INDEX idx_delivery_requests_pool ON delivery_requests (status, deliveryPersonId, deliveryType, requestedAt)',
  'SELECT ''Index idx_delivery_requests_pool already exists'' AS message'
);

PREPARE stmt2 FROM @idx_sql;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

SELECT 'Migration v15 aplicada com sucesso!' AS status;


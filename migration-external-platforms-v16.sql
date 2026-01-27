-- Migration v16: Integração com Plataformas Externas (Pedijá, Iffod, 99Food, etc.)
-- Aplicar no banco do Railway (mysql.railway.internal)
-- Esta versão usa stored procedures para tratamento seguro de erros

-- ============================================
-- BLOCO 1: Adicionar coluna externalPlatform
-- ============================================
DELIMITER $$

CREATE PROCEDURE sp_add_external_platform_column()
BEGIN
  DECLARE CONTINUE HANDLER FOR 1060 BEGIN END; -- Duplicate column
  ALTER TABLE orders ADD COLUMN externalPlatform VARCHAR(50) NULL AFTER deliveryOrderId;
END$$

CALL sp_add_external_platform_column()$$
DROP PROCEDURE sp_add_external_platform_column$$

DELIMITER ;

-- ============================================
-- BLOCO 2: Expandir enum source
-- ============================================
DELIMITER $$

CREATE PROCEDURE sp_update_source_enum()
BEGIN
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
  ALTER TABLE orders MODIFY COLUMN source ENUM(
    'pdv', 'buscazap', 'pedija', 'iffod', '99food', 
    'rappi', 'uber_eats', 'ifood', 'other'
  ) DEFAULT 'pdv' NOT NULL;
END$$

CALL sp_update_source_enum()$$
DROP PROCEDURE sp_update_source_enum$$

DELIMITER ;

-- ============================================
-- BLOCO 3: Criar tabela de integrações
-- ============================================
CREATE TABLE IF NOT EXISTS external_platform_integrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyId INT NOT NULL,
  platform ENUM('pedija', 'iffod', '99food', 'rappi', 'uber_eats', 'ifood', 'other') NOT NULL,
  isActive BOOLEAN DEFAULT TRUE NOT NULL,
  apiKey VARCHAR(255) NULL,
  apiSecret VARCHAR(255) NULL,
  webhookUrl VARCHAR(500) NULL,
  webhookSecret VARCHAR(255) NULL,
  settings JSON NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  UNIQUE KEY unique_company_platform (companyId, platform),
  INDEX idx_company_active (companyId, isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BLOCO 4: Adicionar foreign key (se possível)
-- ============================================
DELIMITER $$

CREATE PROCEDURE sp_add_foreign_key()
BEGIN
  DECLARE companies_count INT DEFAULT 0;
  DECLARE fk_count INT DEFAULT 0;
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
  
  SELECT COUNT(*) INTO companies_count
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'companies';
  
  SELECT COUNT(*) INTO fk_count
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'external_platform_integrations'
    AND CONSTRAINT_NAME LIKE '%companyId%';
  
  IF companies_count > 0 AND fk_count = 0 THEN
    ALTER TABLE external_platform_integrations 
    ADD CONSTRAINT fk_external_platform_company 
    FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END$$

CALL sp_add_foreign_key()$$
DROP PROCEDURE sp_add_foreign_key$$

DELIMITER ;

-- ============================================
-- BLOCO 5: Criar índice (se não existir)
-- ============================================
DELIMITER $$

CREATE PROCEDURE sp_add_external_index()
BEGIN
  DECLARE idx_count INT DEFAULT 0;
  DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
  
  SELECT COUNT(*) INTO idx_count
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'orders' 
    AND INDEX_NAME = 'idx_orders_external';
  
  IF idx_count = 0 THEN
    CREATE INDEX idx_orders_external ON orders (companyId, source, status, createdAt);
  END IF;
END$$

CALL sp_add_external_index()$$
DROP PROCEDURE sp_add_external_index$$

DELIMITER ;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
SELECT 
  'Migration v16 aplicada com sucesso!' AS status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'external_platform_integrations') AS external_platform_integrations_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'externalPlatform') AS external_platform_column_exists;

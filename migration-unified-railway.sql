-- ============================================================================
-- MIGRATION UNIFICADA: PDV + APP MOBILE BUSCAZAP
-- ============================================================================
-- Descrição: Consolida todas as tabelas necessárias para o PDV funcionar
--            no mesmo banco de dados do app mobile BuscaZap
-- Data: 2025-01-09
-- Banco: MySQL (Railway)
-- ============================================================================

-- IMPORTANTE: Este script é IDEMPOTENTE (pode ser executado múltiplas vezes)
-- Usa CREATE TABLE IF NOT EXISTS e ALTER TABLE com verificações

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;

-- ============================================================================
-- TABELA: companies (já existe no app, mas vamos garantir campos do PDV)
-- ============================================================================

-- Adicionar campos específicos do PDV se não existirem
SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'companies'
    AND COLUMN_NAME = 'slug'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE companies ADD COLUMN slug VARCHAR(255) NULL UNIQUE COMMENT ''Slug único para URLs''',
  'SELECT ''Column slug already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- TABELA: tables (mesas do restaurante)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `tables` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT NOT NULL,
  `number` VARCHAR(10) NOT NULL,
  `capacity` INT DEFAULT 4,
  `status` ENUM('available', 'occupied', 'reserved') DEFAULT 'available' NOT NULL,
  `currentOrderId` INT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `idx_companyId` (`companyId`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA: payment_methods (meios de pagamento)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `payment_methods` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('cash', 'credit', 'debit', 'pix', 'voucher', 'other') NOT NULL,
  `isActive` BOOLEAN DEFAULT TRUE NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `idx_companyId` (`companyId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA: payments (pagamentos de pedidos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `orderId` INT NOT NULL,
  `paymentMethodId` INT NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `idx_orderId` (`orderId`),
  INDEX `idx_paymentMethodId` (`paymentMethodId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA: cash_registers (caixas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `cash_registers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT NOT NULL,
  `userId` INT NOT NULL,
  `openedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `closedAt` TIMESTAMP NULL,
  `initialAmount` DECIMAL(10, 2) NOT NULL,
  `finalAmount` DECIMAL(10, 2) NULL,
  `expectedAmount` DECIMAL(10, 2) NULL,
  `difference` DECIMAL(10, 2) NULL,
  `status` ENUM('open', 'closed') DEFAULT 'open' NOT NULL,
  INDEX `idx_companyId` (`companyId`),
  INDEX `idx_userId` (`userId`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA: cash_movements (movimentações de caixa)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `cash_movements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cashRegisterId` INT NOT NULL,
  `type` ENUM('withdrawal', 'reinforcement', 'sale') NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `reason` TEXT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `idx_cashRegisterId` (`cashRegisterId`),
  INDEX `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA: cash_closures (fechamentos de caixa)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `cash_closures` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cashRegisterId` INT NOT NULL UNIQUE,
  `totalSales` DECIMAL(10, 2) NOT NULL,
  `totalCash` DECIMAL(10, 2) NOT NULL,
  `totalCard` DECIMAL(10, 2) NOT NULL,
  `totalPix` DECIMAL(10, 2) NOT NULL,
  `totalOther` DECIMAL(10, 2) NOT NULL,
  `withdrawals` DECIMAL(10, 2) NOT NULL,
  `reinforcements` DECIMAL(10, 2) NOT NULL,
  `notes` TEXT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `idx_cashRegisterId` (`cashRegisterId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA: printers (impressoras térmicas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `printers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `ipAddress` VARCHAR(45) NOT NULL,
  `port` INT DEFAULT 9100,
  `sector` VARCHAR(50) NOT NULL,
  `isActive` BOOLEAN DEFAULT TRUE NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `idx_companyId` (`companyId`),
  INDEX `idx_sector` (`sector`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA: bill_splits (divisão de conta)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `bill_splits` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `orderId` INT NOT NULL,
  `numberOfPeople` INT NOT NULL,
  `splitType` ENUM('equal', 'custom') DEFAULT 'equal' NOT NULL,
  `splitData` JSON NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `idx_orderId` (`orderId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA: chat_messages (mensagens do chat PDV ↔ Cliente)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `orderId` INT NOT NULL,
  `senderType` ENUM('customer', 'business') NOT NULL,
  `message` TEXT NOT NULL,
  `isRead` BOOLEAN DEFAULT FALSE NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `idx_orderId` (`orderId`),
  INDEX `idx_senderType` (`senderType`),
  INDEX `idx_isRead` (`isRead`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABELA: order_ratings (avaliações de pedidos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `order_ratings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `orderId` INT NOT NULL UNIQUE,
  `customerId` INT NOT NULL,
  `companyId` INT NOT NULL,
  `rating` INT NOT NULL CHECK (`rating` >= 1 AND `rating` <= 5),
  `comment` TEXT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `idx_orderId` (`orderId`),
  INDEX `idx_companyId` (`companyId`),
  INDEX `idx_rating` (`rating`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ATUALIZAR TABELA: users (adicionar campos de plano)
-- ============================================================================

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

-- ============================================================================
-- ATUALIZAR TABELA: orders (adicionar campos do PDV)
-- ============================================================================

-- Adicionar campo tableId se não existir
SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'tableId'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE orders ADD COLUMN tableId INT NULL COMMENT ''Mesa associada ao pedido (PDV)''',
  'SELECT ''Column tableId already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar campo source se não existir
SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'source'
);

SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE orders ADD COLUMN source ENUM(''app'', ''pdv'', ''buscazap'') DEFAULT ''app'' NOT NULL COMMENT ''Origem do pedido''',
  'SELECT ''Column source already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- DADOS INICIAIS: Meios de pagamento padrão
-- ============================================================================

-- Inserir meios de pagamento padrão para empresas existentes (se não existirem)
INSERT IGNORE INTO payment_methods (companyId, name, type, isActive)
SELECT DISTINCT c.id, 'Dinheiro', 'cash', TRUE
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM payment_methods pm 
  WHERE pm.companyId = c.id AND pm.type = 'cash'
);

INSERT IGNORE INTO payment_methods (companyId, name, type, isActive)
SELECT DISTINCT c.id, 'Cartão de Crédito', 'credit', TRUE
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM payment_methods pm 
  WHERE pm.companyId = c.id AND pm.type = 'credit'
);

INSERT IGNORE INTO payment_methods (companyId, name, type, isActive)
SELECT DISTINCT c.id, 'Cartão de Débito', 'debit', TRUE
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM payment_methods pm 
  WHERE pm.companyId = c.id AND pm.type = 'debit'
);

INSERT IGNORE INTO payment_methods (companyId, name, type, isActive)
SELECT DISTINCT c.id, 'PIX', 'pix', TRUE
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM payment_methods pm 
  WHERE pm.companyId = c.id AND pm.type = 'pix'
);

-- ============================================================================
-- RESTAURAR CONFIGURAÇÕES
-- ============================================================================

SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

SELECT 'Migration unificada concluída com sucesso!' AS status;
SELECT 'Tabelas criadas/atualizadas:' AS info;
SELECT TABLE_NAME, TABLE_ROWS 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME IN (
    'users', 'companies', 'tables', 'orders', 'order_items', 
    'products', 'categories', 'payment_methods', 'payments',
    'cash_registers', 'cash_movements', 'cash_closures',
    'printers', 'bill_splits', 'chat_messages', 'order_ratings'
  )
ORDER BY TABLE_NAME;

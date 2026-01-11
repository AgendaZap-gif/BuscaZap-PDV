-- Migration v14: Separação Guia Comercial vs PediJá + Entregadores Próprios
-- Aplicar no banco do Railway (mysql.railway.internal)

-- Tabela de configurações de delivery por empresa
CREATE TABLE IF NOT EXISTS company_delivery_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyId INT NOT NULL UNIQUE,
  isOnPedija BOOLEAN DEFAULT FALSE NOT NULL,
  isOnlineForOrders BOOLEAN DEFAULT FALSE NOT NULL,
  hasOwnDrivers BOOLEAN DEFAULT FALSE NOT NULL,
  maxDrivers INT DEFAULT 0 NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_online_companies (isOnPedija, isOnlineForOrders),
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de entregadores próprios por empresa
CREATE TABLE IF NOT EXISTS company_drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyId INT NOT NULL,
  driverId INT NOT NULL,
  isActive BOOLEAN DEFAULT TRUE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE KEY unique_company_driver (companyId, driverId),
  INDEX idx_company_drivers (companyId),
  INDEX idx_driver_company (driverId),
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (driverId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar novos roles ao enum de users (se ainda não existirem)
-- Nota: MySQL não permite ALTER ENUM diretamente, então usamos uma abordagem segura
SET @current_roles = (
  SELECT COLUMN_TYPE 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'role'
);

-- Verificar se os roles já existem
SET @has_admin_global = @current_roles LIKE '%admin_global%';
SET @has_delivery_driver = @current_roles LIKE '%delivery_driver%';

-- Adicionar roles se não existirem
SET @alter_sql = IF(
  @has_admin_global = 0 OR @has_delivery_driver = 0,
  CONCAT(
    'ALTER TABLE users MODIFY COLUMN role ENUM(',
    '''user'', ''admin'', ''waiter'', ''cashier'', ''manager'', ''kitchen'', ',
    '''admin_global'', ''delivery_driver''',
    ') DEFAULT ''user'' NOT NULL'
  ),
  'SELECT ''Roles already exist'' AS message'
);

PREPARE stmt FROM @alter_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Tabela de preços de addon de entregadores por cidade
CREATE TABLE IF NOT EXISTS delivery_addon_pricing (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cityId INT NULL, -- NULL = preço global padrão
  price DECIMAL(10, 2) DEFAULT 49.00 NOT NULL,
  maxDriversIncluded INT DEFAULT 3 NOT NULL,
  description VARCHAR(255) DEFAULT 'Entregadores Próprios - Até 3 entregadores',
  isActive BOOLEAN DEFAULT TRUE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_city_pricing (cityId),
  UNIQUE KEY unique_city_pricing (cityId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir preço padrão global (R$ 49/mês para até 3 entregadores)
INSERT INTO delivery_addon_pricing (cityId, price, maxDriversIncluded, description)
VALUES (NULL, 49.00, 3, 'Entregadores Próprios - Até 3 entregadores')
ON DUPLICATE KEY UPDATE price = 49.00;

-- Verificar se as tabelas foram criadas
SELECT 
  'Migration v14 aplicada com sucesso!' AS status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'company_delivery_settings') AS company_delivery_settings_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'company_drivers') AS company_drivers_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'delivery_addon_pricing') AS delivery_addon_pricing_exists;

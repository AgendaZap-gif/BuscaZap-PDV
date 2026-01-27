-- Migration v16: Integração com Plataformas Externas (Pedijá, Iffod, 99Food, etc.)
-- Versão simplificada - Execute cada bloco separadamente se necessário

-- ============================================
-- BLOCO 1: Adicionar coluna externalPlatform
-- ============================================
-- Execute apenas se a coluna não existir
ALTER TABLE orders ADD COLUMN externalPlatform VARCHAR(50) NULL AFTER deliveryOrderId;

-- Se der erro "Duplicate column name", ignore e continue

-- ============================================
-- BLOCO 2: Expandir enum source
-- ============================================
ALTER TABLE orders MODIFY COLUMN source ENUM(
  'pdv', 
  'buscazap', 
  'pedija', 
  'iffod', 
  '99food', 
  'rappi', 
  'uber_eats', 
  'ifood', 
  'other'
) DEFAULT 'pdv' NOT NULL;

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
-- BLOCO 4: Adicionar foreign key (opcional)
-- ============================================
-- Execute apenas se a tabela companies existir
-- Se der erro, ignore (a FK pode não ser necessária)
ALTER TABLE external_platform_integrations 
ADD CONSTRAINT fk_external_platform_company 
FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE;

-- ============================================
-- BLOCO 5: Criar índice (se não existir)
-- ============================================
CREATE INDEX idx_orders_external ON orders (companyId, source, status, createdAt);

-- Se der erro "Duplicate key name", ignore

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
SELECT 
  'Migration v16 aplicada!' AS status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'external_platform_integrations') AS tabela_criada,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'externalPlatform') AS coluna_criada;

-- ============================================================
-- Migration v17: Sistema de Upsells e Features por Empresa
-- ============================================================
-- Execute no banco de dados de produção (Railway/MySQL)
-- Cada upsell é uma funcionalidade que a empresa pode contratar
-- separadamente ou em conjunto com o plano base.
-- ============================================================

-- Tabela de catálogo de upsells disponíveis (configuração global)
CREATE TABLE IF NOT EXISTS upsell_catalog (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  slug        VARCHAR(80) NOT NULL UNIQUE,   -- identificador único: 'logo_card', 'chat_ai', etc.
  name        VARCHAR(120) NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Upsells disponíveis (catálogo inicial)
INSERT IGNORE INTO upsell_catalog (slug, name, description, price_monthly, sort_order) VALUES
  ('logo_card',       'Logo no Card',           'Exibe a logo da empresa no card de busca do app.', 29.90, 10),
  ('imagem_perfil',   'Imagem no Perfil',        'Foto/banner de capa na página de perfil da empresa no app.', 19.90, 20),
  ('whatsapp',        'Botão WhatsApp',          'Botão de contato direto via WhatsApp no perfil da empresa.', 19.90, 30),
  ('localizacao',     'Localização no Mapa',     'Exibe a empresa no mapa interativo do app com pin e endereço.', 29.90, 40),
  ('instagram',       'Feed do Instagram',       'Exibe os posts recentes do Instagram no perfil da empresa.', 39.90, 50),
  ('catalogo',        'Catálogo de Produtos',    'Catálogo de produtos/serviços com fotos, descrição e preços.', 49.90, 60),
  ('banner_home',     'Banner na Home',          'Banner publicitário na tela inicial do app (alta visibilidade).', 99.90, 70),
  ('chat_ai',         'Chat com IA',             'Assistente virtual com IA para responder clientes 24h.', 79.90, 80),
  ('orcamento',       'Orçamento Online',        'Formulário de orçamento/pedido online integrado ao painel.', 49.90, 90),
  ('destaque_busca',  'Destaque na Busca',       'Empresa aparece no topo dos resultados de busca do app.', 59.90, 100),
  ('notificacoes',    'Notificações Push',       'Envio de notificações push para clientes que seguem a empresa.', 39.90, 110),
  ('relatorios',      'Relatórios Avançados',    'Dashboard com métricas de visitas, cliques e conversões.', 29.90, 120);

-- Tabela de upsells contratados por empresa
CREATE TABLE IF NOT EXISTS company_upsells (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  company_id  INT NOT NULL,
  upsell_slug VARCHAR(80) NOT NULL,
  status      ENUM('active','cancelled','expired','pending') NOT NULL DEFAULT 'active',
  price_paid  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at  TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  notes       TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_company_upsell (company_id, upsell_slug),
  INDEX idx_company_upsells_company (company_id),
  INDEX idx_company_upsells_status (company_id, status),
  CONSTRAINT fk_company_upsells_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar colunas na tabela companies (plano base contratado)
DROP PROCEDURE IF EXISTS AddCompanyPlanColumns;
DELIMITER //
CREATE PROCEDURE AddCompanyPlanColumns()
BEGIN
    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'companies' AND COLUMN_NAME = 'plan_base') THEN
        ALTER TABLE companies ADD COLUMN plan_base ENUM('free','basico','profissional','premium') NOT NULL DEFAULT 'free';
    END IF;
    
    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'companies' AND COLUMN_NAME = 'plan_base_price') THEN
        ALTER TABLE companies ADD COLUMN plan_base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00;
    END IF;
    
    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'companies' AND COLUMN_NAME = 'plan_base_activated_at') THEN
        ALTER TABLE companies ADD COLUMN plan_base_activated_at TIMESTAMP NULL;
    END IF;
    
    IF NOT EXISTS (SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'companies' AND COLUMN_NAME = 'plan_base_expires_at') THEN
        ALTER TABLE companies ADD COLUMN plan_base_expires_at TIMESTAMP NULL;
    END IF;
END //
DELIMITER ;

CALL AddCompanyPlanColumns();
DROP PROCEDURE AddCompanyPlanColumns;

-- Verificação final
SELECT
  'Migration v17 aplicada!' AS status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'upsell_catalog') AS tabela_catalog,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'company_upsells') AS tabela_upsells,
  (SELECT COUNT(*) FROM upsell_catalog) AS upsells_cadastrados;

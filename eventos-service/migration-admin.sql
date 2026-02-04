-- Painel Admin - Tabela de administradores
-- role: 'master' = acesso total | 'produtor' = só edita evento vinculado (evento_id)
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  role ENUM('master', 'produtor') DEFAULT 'produtor',
  evento_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE SET NULL
);

CREATE INDEX idx_admins_email ON admins(email);

-- Primeiro admin: rodar após criar a tabela:
-- node scripts/create-admin.js admin@buscazap.com.br SuaSenhaSegura
-- (ou use o script para gerar o INSERT com senha hasheada)

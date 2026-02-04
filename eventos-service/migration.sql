-- Eventos Service - Tabelas MySQL (Rodar no Railway)
-- Evento ativo: ativo = true AND CURDATE() BETWEEN data_inicio AND data_fim

CREATE TABLE IF NOT EXISTS eventos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cidade VARCHAR(120) NOT NULL,
  banner_url TEXT,
  mapa_url TEXT,
  mapa_largura INT DEFAULT 800,
  mapa_altura INT DEFAULT 600,
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6),
  ativo BOOLEAN DEFAULT true,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL
);

CREATE TABLE IF NOT EXISTS expositores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  evento_id INT NOT NULL,
  categoria_id INT,
  nome VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(20),
  estande VARCHAR(20),
  promocao TEXT,
  destaque BOOLEAN DEFAULT false,
  patrocinado BOOLEAN DEFAULT false,
  pos_x INT DEFAULT 0,
  pos_y INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

CREATE INDEX idx_evento_cidade ON eventos(cidade);
CREATE INDEX idx_evento_ativo_datas ON eventos(ativo, data_inicio, data_fim);
CREATE INDEX idx_expositor_evento ON expositores(evento_id);
CREATE INDEX idx_expositor_categoria ON expositores(categoria_id);

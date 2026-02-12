-- Banners publicitários (Home / Guia comercial) – exibidos no app
-- cityId NULL = banner global; page = 'home' | 'guia_comercial'

CREATE TABLE IF NOT EXISTS banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  city_id INT NULL COMMENT 'NULL = todas as cidades',
  page ENUM('home', 'guia_comercial') NOT NULL DEFAULT 'home',
  title VARCHAR(200) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  position ENUM('top', 'middle', 'bottom') NOT NULL DEFAULT 'top',
  format ENUM('vertical', 'horizontal') NOT NULL DEFAULT 'horizontal',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  start_date DATE NULL,
  end_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_banners_city_page ON banners(city_id, page);
CREATE INDEX idx_banners_active_dates ON banners(is_active, start_date, end_date);

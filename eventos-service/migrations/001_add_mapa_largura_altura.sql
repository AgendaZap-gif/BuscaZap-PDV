-- Adiciona colunas mapa_largura e mapa_altura na tabela eventos.
-- Rodar no MySQL (Railway ou local) quando aparecer: Unknown column 'mapa_largura' in 'field list'
-- Se der "Duplicate column name", a coluna já existe; pode ignorar.

ALTER TABLE eventos ADD COLUMN mapa_largura INT DEFAULT 800;
ALTER TABLE eventos ADD COLUMN mapa_altura INT DEFAULT 600;

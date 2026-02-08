-- Expositores: logo (pins do mapa), imagem do título (cabeçalho da página no app), banner (patrocinador no mapa), login/senha (área do expositor)
-- Rodar no MySQL quando for usar esses recursos.

ALTER TABLE expositores ADD COLUMN logo_url TEXT NULL;
ALTER TABLE expositores ADD COLUMN imagem_titulo_url TEXT NULL;
ALTER TABLE expositores ADD COLUMN banner_url TEXT NULL;
ALTER TABLE expositores ADD COLUMN login VARCHAR(255) NULL UNIQUE;
ALTER TABLE expositores ADD COLUMN senha VARCHAR(255) NULL;

CREATE INDEX idx_expositor_login ON expositores(login);

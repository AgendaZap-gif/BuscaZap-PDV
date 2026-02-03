-- Adiciona coluna domain em companies (white label por domínio).
-- Se a coluna já existir, ignore o erro "Duplicate column name 'domain'".

ALTER TABLE `companies` ADD COLUMN `domain` VARCHAR(255) NULL;

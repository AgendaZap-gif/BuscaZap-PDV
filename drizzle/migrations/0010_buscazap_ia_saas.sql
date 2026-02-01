-- BuscaZap IA / SaaS: embeddings, user_memory, marketplace, whatsapp_numbers, companies (domain, referral, engagement)

-- Companies: novas colunas
ALTER TABLE `companies` ADD COLUMN IF NOT EXISTS `passwordHash` TEXT;
ALTER TABLE `companies` ADD COLUMN IF NOT EXISTS `referralCode` VARCHAR(20) UNIQUE;
ALTER TABLE `companies` ADD COLUMN IF NOT EXISTS `domain` VARCHAR(255);
ALTER TABLE `companies` ADD COLUMN IF NOT EXISTS `engagementScore` INT NOT NULL DEFAULT 100;

-- MySQL não suporta IF NOT EXISTS em ADD COLUMN; use manualmente ou ignore erros se já existir
-- Se der erro "Duplicate column", as colunas já existem.

-- Embeddings
CREATE TABLE IF NOT EXISTS `embeddings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT NOT NULL,
  `content` TEXT NOT NULL,
  `vector` JSON NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- User memory
CREATE TABLE IF NOT EXISTS `user_memory` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT NOT NULL,
  `customerPhone` VARCHAR(20) NOT NULL,
  `key` VARCHAR(100) NOT NULL,
  `value` TEXT NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- WhatsApp numbers (multi número)
CREATE TABLE IF NOT EXISTS `whatsapp_numbers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `token` TEXT,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Marketplace ads
CREATE TABLE IF NOT EXISTS `marketplace_ads` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

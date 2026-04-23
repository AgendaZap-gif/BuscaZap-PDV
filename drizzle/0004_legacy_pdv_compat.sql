-- Compatibilidade entre schema legado do BuscaZap-PDV e o novo yume-multiramo.
-- Esta migração evita quebrar tabelas já existentes e adiciona apenas o necessário.

CREATE TABLE IF NOT EXISTS `sellers` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `storeName` varchar(255) NOT NULL,
  `storeDescription` text,
  `businessType` enum('commerce','services','restaurant') NOT NULL DEFAULT 'commerce',
  `cnpj` varchar(20),
  `phone` varchar(20),
  `address` text,
  `city` varchar(100),
  `state` varchar(2),
  `zipCode` varchar(10),
  `buscazapCompanyId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `sellers_id` PRIMARY KEY(`id`),
  CONSTRAINT `sellers_userId_unique` UNIQUE(`userId`)
);

CREATE TABLE IF NOT EXISTS `productVariations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `productId` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `value` varchar(100) NOT NULL,
  `priceModifier` varchar(20) DEFAULT '0',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `productVariations_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `stock` (
  `id` int AUTO_INCREMENT NOT NULL,
  `productId` int NOT NULL,
  `quantity` int NOT NULL DEFAULT 0,
  `minThreshold` int DEFAULT 5,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `stock_id` PRIMARY KEY(`id`),
  CONSTRAINT `stock_productId_unique` UNIQUE(`productId`)
);

CREATE TABLE IF NOT EXISTS `transactions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `sellerId` int NOT NULL,
  `orderId` int,
  `type` varchar(50) NOT NULL,
  `amount` varchar(20) NOT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `orderItems` (
  `id` int AUTO_INCREMENT NOT NULL,
  `orderId` int NOT NULL,
  `productId` int NOT NULL,
  `quantity` int NOT NULL,
  `unitPrice` varchar(20) NOT NULL,
  `totalPrice` varchar(20) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);

-- Ajustes em tabelas que já existem no legado.
ALTER TABLE `customers` ADD COLUMN IF NOT EXISTS `sellerId` int;
ALTER TABLE `customers` ADD COLUMN IF NOT EXISTS `totalSpent` varchar(20) DEFAULT '0';
ALTER TABLE `customers` ADD COLUMN IF NOT EXISTS `lastOrderDate` timestamp NULL;

ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `sellerId` int;
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `sku` varchar(100) NULL;
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `cost` varchar(20) NULL;
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `category` varchar(100) NULL;
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `weight` varchar(20) NULL;
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `length` varchar(20) NULL;
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `width` varchar(20) NULL;
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `height` varchar(20) NULL;
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `duration` int NULL;
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `images` text NULL;

ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `sellerId` int;
ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `customerEmail` varchar(320) NULL;
ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `shippingAddress` text NULL;
ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `totalAmount` varchar(20) NULL;
ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `shippingCost` varchar(20) NULL;
ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `paymentMethod` varchar(50) NULL;
ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `trackingCode` varchar(100) NULL;
ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `scheduledDate` timestamp NULL;
ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `deliveryTime` varchar(20) NULL;

CREATE INDEX IF NOT EXISTS `idx_customers_sellerId` ON `customers` (`sellerId`);
CREATE INDEX IF NOT EXISTS `idx_products_sellerId` ON `products` (`sellerId`);
CREATE INDEX IF NOT EXISTS `idx_orders_sellerId` ON `orders` (`sellerId`);

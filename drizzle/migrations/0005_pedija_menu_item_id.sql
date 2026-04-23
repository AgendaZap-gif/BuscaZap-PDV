-- =============================================================
-- BuscaZap-PDV — Setup completo do banco (idempotente)
-- Execute este arquivo inteiro no DBeaver / Railway Query Editor
-- =============================================================

-- 1. Tabela de usuários
CREATE TABLE IF NOT EXISTS `users` (
  `id` int AUTO_INCREMENT NOT NULL,
  `openId` varchar(64) NOT NULL,
  `name` text,
  `email` varchar(320),
  `loginMethod` varchar(64),
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `users_id` PRIMARY KEY(`id`),
  CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);

-- 2. Sellers (lojas/restaurantes)
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

-- 3. Produtos / cardápio
CREATE TABLE IF NOT EXISTS `products` (
  `id` int AUTO_INCREMENT NOT NULL,
  `sellerId` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `sku` varchar(100) NOT NULL,
  `price` varchar(20) NOT NULL,
  `cost` varchar(20),
  `category` varchar(100),
  `weight` varchar(20),
  `length` varchar(20),
  `width` varchar(20),
  `height` varchar(20),
  `duration` int,
  `preparationTime` int,
  `images` text,
  `isActive` int NOT NULL DEFAULT 1,
  `buscazapMenuItemId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `products_id` PRIMARY KEY(`id`)
);

-- 4. Variações de produto
CREATE TABLE IF NOT EXISTS `productVariations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `productId` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `value` varchar(100) NOT NULL,
  `priceModifier` varchar(20) DEFAULT '0',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `productVariations_id` PRIMARY KEY(`id`)
);

-- 5. Estoque
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

-- 6. Clientes (CRM)
CREATE TABLE IF NOT EXISTS `customers` (
  `id` int AUTO_INCREMENT NOT NULL,
  `sellerId` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(320),
  `phone` varchar(20),
  `city` varchar(100),
  `state` varchar(2),
  `address` text,
  `totalOrders` int DEFAULT 0,
  `totalSpent` varchar(20) DEFAULT '0',
  `lastOrderDate` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);

-- 7. Pedidos internos (PDV)
CREATE TABLE IF NOT EXISTS `orders` (
  `id` int AUTO_INCREMENT NOT NULL,
  `sellerId` int NOT NULL,
  `orderNumber` varchar(50) NOT NULL,
  `customerName` varchar(255) NOT NULL,
  `customerEmail` varchar(320),
  `customerPhone` varchar(20),
  `shippingAddress` text,
  `totalAmount` varchar(20) NOT NULL,
  `shippingCost` varchar(20),
  `paymentMethod` varchar(50),
  `status` varchar(50) DEFAULT 'pending',
  `trackingCode` varchar(100),
  `scheduledDate` timestamp NULL,
  `deliveryTime` varchar(20),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `orders_id` PRIMARY KEY(`id`),
  CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);

-- 8. Itens dos pedidos
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

-- 9. Transações financeiras
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

-- 10. Pedidos Pedijá recebidos do BuscaZap via webhook
CREATE TABLE IF NOT EXISTS `pedija_orders` (
  `id` int AUTO_INCREMENT NOT NULL,
  `sellerId` int NOT NULL,
  `buscazapOrderId` int NOT NULL,
  `buscazapCompanyId` int NOT NULL,
  `customerName` varchar(255) NOT NULL DEFAULT 'Cliente',
  `total` varchar(20) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'pending',
  `items` text NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `pedija_orders_id` PRIMARY KEY(`id`),
  CONSTRAINT `pedija_orders_buscazapOrderId_unique` UNIQUE(`buscazapOrderId`)
);

CREATE INDEX `idx_pedija_orders_sellerId` ON `pedija_orders` (`sellerId`);
CREATE INDEX `idx_pedija_orders_status` ON `pedija_orders` (`status`);

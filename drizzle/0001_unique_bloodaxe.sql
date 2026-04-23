CREATE TABLE `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` varchar(20) NOT NULL,
	`totalPrice` varchar(20) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
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
	`scheduledDate` timestamp,
	`deliveryTime` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `productVariations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`value` varchar(100) NOT NULL,
	`priceModifier` varchar(20) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productVariations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sellers` (
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sellers_id` PRIMARY KEY(`id`),
	CONSTRAINT `sellers_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `stock` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 0,
	`minThreshold` int DEFAULT 5,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stock_id` PRIMARY KEY(`id`),
	CONSTRAINT `stock_productId_unique` UNIQUE(`productId`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sellerId` int NOT NULL,
	`orderId` int,
	`type` varchar(50) NOT NULL,
	`amount` varchar(20) NOT NULL,
	`status` varchar(50) DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);

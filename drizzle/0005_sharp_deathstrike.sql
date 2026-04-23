CREATE TABLE `pedija_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sellerId` int NOT NULL,
	`buscazapOrderId` int NOT NULL,
	`buscazapCompanyId` int NOT NULL,
	`customerName` varchar(255) NOT NULL DEFAULT 'Cliente',
	`total` varchar(20) NOT NULL,
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`items` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pedija_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `pedija_orders_buscazapOrderId_unique` UNIQUE(`buscazapOrderId`)
);
--> statement-breakpoint
ALTER TABLE `products` ADD `buscazapMenuItemId` int;--> statement-breakpoint
ALTER TABLE `sellers` ADD `buscazapCompanyId` int;
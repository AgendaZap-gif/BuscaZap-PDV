CREATE TABLE `customers` (
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
	`lastOrderDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);

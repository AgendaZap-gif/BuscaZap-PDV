CREATE TABLE `cash_closures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cashRegisterId` int NOT NULL,
	`paymentMethodId` int NOT NULL,
	`expectedAmount` decimal(10,2) NOT NULL,
	`countedAmount` decimal(10,2) NOT NULL,
	`difference` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cash_closures_id` PRIMARY KEY(`id`)
);

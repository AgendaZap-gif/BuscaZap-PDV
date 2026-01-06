CREATE TABLE `delivery_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`orderId` int NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`customerPhone` varchar(20) NOT NULL,
	`deliveryAddress` text NOT NULL,
	`deliveryFee` decimal(10,2) NOT NULL,
	`status` enum('pending','accepted','in_transit','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`deliveryPersonId` int,
	`deliveryPersonName` varchar(255),
	`notes` text,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	`deliveredAt` timestamp,
	CONSTRAINT `delivery_requests_id` PRIMARY KEY(`id`)
);

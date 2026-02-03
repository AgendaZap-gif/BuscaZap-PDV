-- Tabela user_behavior para recomendações proativas (cron).
-- Usada pelo cron de recomendações; se não existir, o cron apenas não envia recomendações.

CREATE TABLE IF NOT EXISTS `user_behavior` (
  `id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `companyId` int NOT NULL,
  `customerPhone` varchar(20) NOT NULL,
  `action` enum('message','order','quote','click','view','search','rating') NOT NULL,
  `category` varchar(80) NULL,
  `productId` int NULL,
  `value` decimal(10,2) NULL,
  `metadata` json NULL,
  `dayOfWeek` int NOT NULL,
  `hourOfDay` int NOT NULL,
  `createdAt` timestamp DEFAULT (now()) NOT NULL
);

-- Agenda: planos de saúde, pacientes, disponibilidade, quotas, agendamentos (secretária - clínicas, hospitais, comércios)

CREATE TABLE IF NOT EXISTS `agenda_health_plans` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `slug` VARCHAR(60) NOT NULL,
  `color` VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `defaultDurationMinutes` INT NOT NULL DEFAULT 30,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS `agenda_patients` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `email` VARCHAR(320),
  `document` VARCHAR(20),
  `birthDate` VARCHAR(10),
  `healthPlanId` INT,
  `address` TEXT,
  `notes` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS `agenda_availability` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT NOT NULL,
  `dayOfWeek` INT NOT NULL,
  `startTime` VARCHAR(5) NOT NULL,
  `endTime` VARCHAR(5) NOT NULL,
  `slotMinutes` INT NOT NULL DEFAULT 30,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS `agenda_quotas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT NOT NULL,
  `healthPlanId` INT NOT NULL,
  `period` ENUM('week', 'month') NOT NULL,
  `maxSlots` INT NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS `agenda_appointments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `companyId` INT NOT NULL,
  `patientId` INT NOT NULL,
  `healthPlanId` INT,
  `startAt` TIMESTAMP NOT NULL,
  `endAt` TIMESTAMP NOT NULL,
  `durationMinutes` INT NOT NULL DEFAULT 30,
  `status` ENUM('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show') NOT NULL DEFAULT 'scheduled',
  `confirmedAt` TIMESTAMP NULL,
  `salebotPendingId` VARCHAR(64),
  `notes` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

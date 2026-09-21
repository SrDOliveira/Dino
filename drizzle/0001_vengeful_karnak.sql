CREATE TABLE `studySnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`payload` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studySnapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `studySnapshots_userId_unique` UNIQUE(`userId`)
);

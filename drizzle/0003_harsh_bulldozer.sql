CREATE TABLE `leagueBlocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`blockedUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leagueBlocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leagueReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterUserId` int NOT NULL,
	`messageId` int NOT NULL,
	`reason` enum('offense','spam','unsafe','other') NOT NULL,
	`status` enum('open','reviewed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leagueReports_id` PRIMARY KEY(`id`)
);

CREATE TABLE `leagueMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`authorName` varchar(120) NOT NULL,
	`kind` enum('text','audio') NOT NULL,
	`body` text,
	`audioUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leagueMessages_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `civilizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`livedMonths` integer DEFAULT 0 NOT NULL,
	`buildings` text NOT NULL,
	`citizens` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `civilizations_resources` (
	`id` text PRIMARY KEY NOT NULL,
	`civilizationId` text,
	`type` text NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`civilizationId`) REFERENCES `civilizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `civilizations_worlds` (
	`id` text PRIMARY KEY NOT NULL,
	`civilizationId` text NOT NULL,
	`worldId` text NOT NULL,
	FOREIGN KEY (`civilizationId`) REFERENCES `civilizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`worldId`) REFERENCES `worlds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`email` text NOT NULL,
	`authorizationKey` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `users_civilizations` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text,
	`civilizationId` text,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`civilizationId`) REFERENCES `civilizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `worlds` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`month` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `worlds_resources` (
	`id` text PRIMARY KEY NOT NULL,
	`worldId` text,
	`type` text NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`worldId`) REFERENCES `worlds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `civilizations_name_unique` ON `civilizations` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `worlds_name_unique` ON `worlds` (`name`);
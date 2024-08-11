CREATE TABLE `civilizations` (
	`id` text PRIMARY KEY NOT NULL,
	`buildings` blob DEFAULT '[]' NOT NULL,
	`citizens` blob DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`email` text NOT NULL,
	`civilizationsId` text,
	FOREIGN KEY (`civilizationsId`) REFERENCES `civilizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `worlds` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`month` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `worlds_resources` (
	`id` text PRIMARY KEY NOT NULL,
	`worldId` text,
	`type` text NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`worldId`) REFERENCES `worlds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `worlds_name_unique` ON `worlds` (`name`);
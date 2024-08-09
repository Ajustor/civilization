CREATE TABLE `resources` (
	`type` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `worlds` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`month` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `worlds_resources` (
	`id` text PRIMARY KEY NOT NULL,
	`worldId` text,
	`resourceType` text,
	`quantity` integer DEFAULT 0,
	FOREIGN KEY (`worldId`) REFERENCES `worlds`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`resourceType`) REFERENCES `resources`(`type`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `worlds_name_unique` ON `worlds` (`name`);
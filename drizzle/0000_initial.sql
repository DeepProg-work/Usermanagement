CREATE TABLE `account` (
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	PRIMARY KEY(`provider`, `providerAccountId`),
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `authenticator` (
	`credentialID` text NOT NULL,
	`userId` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`credentialPublicKey` text NOT NULL,
	`counter` integer NOT NULL,
	`credentialDeviceType` text NOT NULL,
	`credentialBackedUp` integer NOT NULL,
	`transports` text,
	PRIMARY KEY(`userId`, `credentialID`),
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `authenticator_credentialID_unique` ON `authenticator` (`credentialID`);--> statement-breakpoint
CREATE TABLE `courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `explanations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_id` integer NOT NULL,
	`explanation_text` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `explanations_question_id_unique` ON `explanations` (`question_id`);--> statement-breakpoint
CREATE TABLE `question_options` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_id` integer NOT NULL,
	`option_text` text NOT NULL,
	`is_correct` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quiz_id` integer NOT NULL,
	`question_text` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `quizzes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`course_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_name_unique` ON `roles` (`name`);--> statement-breakpoint
CREATE TABLE `session` (
	`sessionToken` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_courses` (
	`user_id` text NOT NULL,
	`course_id` integer NOT NULL,
	`role_id` integer NOT NULL,
	`assigned_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	PRIMARY KEY(`user_id`, `course_id`, `role_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_quizzes` (
	`user_id` text NOT NULL,
	`quiz_id` integer NOT NULL,
	`role_id` integer NOT NULL,
	`assigned_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	PRIMARY KEY(`user_id`, `quiz_id`, `role_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text,
	`emailVerified` integer,
	`image` text,
	`role_id` integer,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verificationToken` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);

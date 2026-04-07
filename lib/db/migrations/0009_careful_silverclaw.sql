ALTER TABLE "users" ADD COLUMN "dining_interests" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "business_goals" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "experience_level" varchar(30);
CREATE TABLE "opening_hours" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"open_time" varchar(10),
	"close_time" varchar(10),
	"is_closed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_types" ADD COLUMN "category" varchar(100) DEFAULT 'restaurant';--> statement-breakpoint
ALTER TABLE "booking_types" ADD COLUMN "average_price_per_person" double precision;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "logo" varchar(500);--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "about_company" text;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "what_is_this_business" text;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "what_can_i_book_here" text;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "when_should_recommend" text;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "what_can_customers_book" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "best_for" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "atmosphere" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "what_makes_unique" text;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "when_should_choose" text;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "when_should_not_choose" text;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "popular_dishes" text;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "min_guest_size" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "max_guest_size" integer DEFAULT 20;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "price_range_from" double precision;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "price_range_to" double precision;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "target_audience" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "opening_hours" ADD CONSTRAINT "opening_hours_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "opening_hours_provider_date_idx" ON "opening_hours" USING btree ("provider_id","date");
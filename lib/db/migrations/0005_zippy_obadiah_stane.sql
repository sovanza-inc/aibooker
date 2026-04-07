ALTER TABLE "booking_types" ADD COLUMN "public_id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "public_id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "public_id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "providers" ADD CONSTRAINT "providers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "providers_dashboard_email_idx" ON "providers" USING btree ("dashboard_email");--> statement-breakpoint
CREATE INDEX "providers_user_id_idx" ON "providers" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "booking_types" ADD CONSTRAINT "booking_types_public_id_unique" UNIQUE("public_id");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_public_id_unique" UNIQUE("public_id");--> statement-breakpoint
ALTER TABLE "providers" ADD CONSTRAINT "providers_public_id_unique" UNIQUE("public_id");--> statement-breakpoint
UPDATE "providers" SET "user_id" = u."id" FROM "users" u WHERE u."email" = "providers"."dashboard_email" AND "providers"."user_id" IS NULL;
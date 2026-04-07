ALTER TABLE "customer_leads" DROP CONSTRAINT "customer_leads_fingerprint_unique";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "click_id";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "lead_id";--> statement-breakpoint
ALTER TABLE "customer_leads" DROP COLUMN "fingerprint";--> statement-breakpoint
ALTER TABLE "providers" DROP COLUMN "dashboard_password_hash";
-- Migration: Convert ALL tables from serial integer PKs to UUID PKs
-- This is a destructive migration that recreates all tables with UUID primary keys.
-- Existing data is preserved through temporary backup tables.

-- Step 1: Drop all FK constraints first (child tables before parent tables)
ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_provider_id_providers_id_fk";
ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_booking_type_id_booking_types_id_fk";
ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_customer_lead_id_customer_leads_id_fk";
ALTER TABLE "availability_slots" DROP CONSTRAINT IF EXISTS "availability_slots_booking_type_id_booking_types_id_fk";
ALTER TABLE "opening_hours" DROP CONSTRAINT IF EXISTS "opening_hours_provider_id_providers_id_fk";
ALTER TABLE "provider_locations" DROP CONSTRAINT IF EXISTS "provider_locations_provider_id_providers_id_fk";
ALTER TABLE "booking_types" DROP CONSTRAINT IF EXISTS "booking_types_provider_id_providers_id_fk";
ALTER TABLE "providers" DROP CONSTRAINT IF EXISTS "providers_integration_id_integrations_id_fk";
ALTER TABLE "providers" DROP CONSTRAINT IF EXISTS "providers_user_id_users_id_fk";
ALTER TABLE "webhook_logs" DROP CONSTRAINT IF EXISTS "webhook_logs_integration_id_integrations_id_fk";
ALTER TABLE "integrations" DROP CONSTRAINT IF EXISTS "integrations_team_id_teams_id_fk";
ALTER TABLE "accounts" DROP CONSTRAINT IF EXISTS "accounts_user_id_users_id_fk";
ALTER TABLE "team_members" DROP CONSTRAINT IF EXISTS "team_members_user_id_users_id_fk";
ALTER TABLE "team_members" DROP CONSTRAINT IF EXISTS "team_members_team_id_teams_id_fk";
ALTER TABLE "activity_logs" DROP CONSTRAINT IF EXISTS "activity_logs_team_id_teams_id_fk";
ALTER TABLE "activity_logs" DROP CONSTRAINT IF EXISTS "activity_logs_user_id_users_id_fk";
ALTER TABLE "invitations" DROP CONSTRAINT IF EXISTS "invitations_team_id_teams_id_fk";
ALTER TABLE "invitations" DROP CONSTRAINT IF EXISTS "invitations_invited_by_users_id_fk";--> statement-breakpoint

-- Step 2: Drop unique constraints that reference old columns
ALTER TABLE "booking_types" DROP CONSTRAINT IF EXISTS "booking_types_public_id_unique";
ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_public_id_unique";
ALTER TABLE "providers" DROP CONSTRAINT IF EXISTS "providers_public_id_unique";
ALTER TABLE "providers" DROP CONSTRAINT IF EXISTS "providers_integration_id_unique";
ALTER TABLE "provider_locations" DROP CONSTRAINT IF EXISTS "provider_locations_provider_id_unique";--> statement-breakpoint

-- Step 3: Drop indexes that will be recreated
DROP INDEX IF EXISTS "bookings_provider_status_idx";
DROP INDEX IF EXISTS "bookings_date_idx";
DROP INDEX IF EXISTS "bookings_external_id_idx";
DROP INDEX IF EXISTS "booking_types_provider_external_idx";
DROP INDEX IF EXISTS "booking_types_provider_active_idx";
DROP INDEX IF EXISTS "availability_slots_unique_idx";
DROP INDEX IF EXISTS "availability_slots_date_time_idx";
DROP INDEX IF EXISTS "availability_slots_expires_idx";
DROP INDEX IF EXISTS "opening_hours_provider_date_idx";
DROP INDEX IF EXISTS "providers_status_idx";
DROP INDEX IF EXISTS "providers_dashboard_email_idx";
DROP INDEX IF EXISTS "providers_user_id_idx";--> statement-breakpoint

-- Step 4: Add new UUID columns to all tables
-- Users
ALTER TABLE "users" ADD COLUMN "new_id" uuid DEFAULT gen_random_uuid() NOT NULL;
-- Teams
ALTER TABLE "teams" ADD COLUMN "new_id" uuid DEFAULT gen_random_uuid() NOT NULL;
-- Team Members
ALTER TABLE "team_members" ADD COLUMN "new_id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "team_members" ADD COLUMN "new_user_id" uuid;
ALTER TABLE "team_members" ADD COLUMN "new_team_id" uuid;
-- Activity Logs
ALTER TABLE "activity_logs" ADD COLUMN "new_id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "activity_logs" ADD COLUMN "new_team_id" uuid;
ALTER TABLE "activity_logs" ADD COLUMN "new_user_id" uuid;
-- Invitations
ALTER TABLE "invitations" ADD COLUMN "new_id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "invitations" ADD COLUMN "new_team_id" uuid;
ALTER TABLE "invitations" ADD COLUMN "new_invited_by" uuid;
-- Accounts
ALTER TABLE "accounts" ADD COLUMN "new_id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "accounts" ADD COLUMN "new_user_id" uuid;
-- Integrations
ALTER TABLE "integrations" ADD COLUMN "new_id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "integrations" ADD COLUMN "new_team_id" uuid;
-- Providers
ALTER TABLE "providers" ADD COLUMN "new_id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "providers" ADD COLUMN "new_user_id" uuid;
ALTER TABLE "providers" ADD COLUMN "new_integration_id" uuid;
-- Provider Locations
ALTER TABLE "provider_locations" ADD COLUMN "new_id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "provider_locations" ADD COLUMN "new_provider_id" uuid;
-- Booking Types
ALTER TABLE "booking_types" ADD COLUMN "new_id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "booking_types" ADD COLUMN "new_provider_id" uuid;
-- Availability Slots
ALTER TABLE "availability_slots" ADD COLUMN "new_id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "availability_slots" ADD COLUMN "new_booking_type_id" uuid;
-- Opening Hours
ALTER TABLE "opening_hours" ADD COLUMN "new_id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "opening_hours" ADD COLUMN "new_provider_id" uuid;
-- Customer Leads
ALTER TABLE "customer_leads" ADD COLUMN "new_id" uuid DEFAULT gen_random_uuid() NOT NULL;
-- Bookings
ALTER TABLE "bookings" ADD COLUMN "new_id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "bookings" ADD COLUMN "new_provider_id" uuid;
ALTER TABLE "bookings" ADD COLUMN "new_booking_type_id" uuid;
ALTER TABLE "bookings" ADD COLUMN "new_customer_lead_id" uuid;
-- Webhook Logs
ALTER TABLE "webhook_logs" ADD COLUMN "new_id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE "webhook_logs" ADD COLUMN "new_integration_id" uuid;--> statement-breakpoint

-- Step 5: Backfill FK UUID columns by joining on old integer IDs
-- Team Members
UPDATE "team_members" tm SET
  "new_user_id" = u."new_id"
FROM "users" u WHERE u."id" = tm."user_id";
UPDATE "team_members" tm SET
  "new_team_id" = t."new_id"
FROM "teams" t WHERE t."id" = tm."team_id";
-- Activity Logs
UPDATE "activity_logs" al SET
  "new_team_id" = t."new_id"
FROM "teams" t WHERE t."id" = al."team_id";
UPDATE "activity_logs" al SET
  "new_user_id" = u."new_id"
FROM "users" u WHERE u."id" = al."user_id";
-- Invitations
UPDATE "invitations" i SET
  "new_team_id" = t."new_id"
FROM "teams" t WHERE t."id" = i."team_id";
UPDATE "invitations" i SET
  "new_invited_by" = u."new_id"
FROM "users" u WHERE u."id" = i."invited_by";
-- Accounts
UPDATE "accounts" a SET
  "new_user_id" = u."new_id"
FROM "users" u WHERE u."id" = a."user_id";
-- Integrations
UPDATE "integrations" ig SET
  "new_team_id" = t."new_id"
FROM "teams" t WHERE t."id" = ig."team_id";
-- Providers
UPDATE "providers" p SET
  "new_user_id" = u."new_id"
FROM "users" u WHERE u."id" = p."user_id";
UPDATE "providers" p SET
  "new_integration_id" = ig."new_id"
FROM "integrations" ig WHERE ig."id" = p."integration_id";
-- Provider Locations
UPDATE "provider_locations" pl SET
  "new_provider_id" = p."new_id"
FROM "providers" p WHERE p."id" = pl."provider_id";
-- Booking Types
UPDATE "booking_types" bt SET
  "new_provider_id" = p."new_id"
FROM "providers" p WHERE p."id" = bt."provider_id";
-- Availability Slots
UPDATE "availability_slots" avs SET
  "new_booking_type_id" = bt."new_id"
FROM "booking_types" bt WHERE bt."id" = avs."booking_type_id";
-- Opening Hours
UPDATE "opening_hours" oh SET
  "new_provider_id" = p."new_id"
FROM "providers" p WHERE p."id" = oh."provider_id";
-- Customer Leads (no FKs out)
-- Bookings
UPDATE "bookings" b SET
  "new_provider_id" = p."new_id"
FROM "providers" p WHERE p."id" = b."provider_id";
UPDATE "bookings" b SET
  "new_booking_type_id" = bt."new_id"
FROM "booking_types" bt WHERE bt."id" = b."booking_type_id";
UPDATE "bookings" b SET
  "new_customer_lead_id" = cl."new_id"
FROM "customer_leads" cl WHERE cl."id" = b."customer_lead_id";
-- Webhook Logs
UPDATE "webhook_logs" wl SET
  "new_integration_id" = ig."new_id"
FROM "integrations" ig WHERE ig."id" = wl."integration_id";--> statement-breakpoint

-- Step 6: Drop old PK constraints
ALTER TABLE "users" DROP CONSTRAINT "users_pkey";
ALTER TABLE "teams" DROP CONSTRAINT "teams_pkey";
ALTER TABLE "team_members" DROP CONSTRAINT "team_members_pkey";
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_pkey";
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_pkey";
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_pkey";
ALTER TABLE "integrations" DROP CONSTRAINT "integrations_pkey";
ALTER TABLE "providers" DROP CONSTRAINT "providers_pkey";
ALTER TABLE "provider_locations" DROP CONSTRAINT "provider_locations_pkey";
ALTER TABLE "booking_types" DROP CONSTRAINT "booking_types_pkey";
ALTER TABLE "availability_slots" DROP CONSTRAINT "availability_slots_pkey";
ALTER TABLE "opening_hours" DROP CONSTRAINT "opening_hours_pkey";
ALTER TABLE "customer_leads" DROP CONSTRAINT "customer_leads_pkey";
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_pkey";
ALTER TABLE "webhook_logs" DROP CONSTRAINT "webhook_logs_pkey";--> statement-breakpoint

-- Step 7: Drop old serial ID and FK columns, rename new UUID columns
-- Users
ALTER TABLE "users" DROP COLUMN "id";
ALTER TABLE "users" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "users" ADD PRIMARY KEY ("id");

-- Teams
ALTER TABLE "teams" DROP COLUMN "id";
ALTER TABLE "teams" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "teams" ADD PRIMARY KEY ("id");

-- Team Members
ALTER TABLE "team_members" DROP COLUMN "id";
ALTER TABLE "team_members" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "team_members" ADD PRIMARY KEY ("id");
ALTER TABLE "team_members" DROP COLUMN "user_id";
ALTER TABLE "team_members" RENAME COLUMN "new_user_id" TO "user_id";
ALTER TABLE "team_members" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "team_members" DROP COLUMN "team_id";
ALTER TABLE "team_members" RENAME COLUMN "new_team_id" TO "team_id";
ALTER TABLE "team_members" ALTER COLUMN "team_id" SET NOT NULL;

-- Activity Logs
ALTER TABLE "activity_logs" DROP COLUMN "id";
ALTER TABLE "activity_logs" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "activity_logs" ADD PRIMARY KEY ("id");
ALTER TABLE "activity_logs" DROP COLUMN "team_id";
ALTER TABLE "activity_logs" RENAME COLUMN "new_team_id" TO "team_id";
ALTER TABLE "activity_logs" ALTER COLUMN "team_id" SET NOT NULL;
ALTER TABLE "activity_logs" DROP COLUMN "user_id";
ALTER TABLE "activity_logs" RENAME COLUMN "new_user_id" TO "user_id";

-- Invitations
ALTER TABLE "invitations" DROP COLUMN "id";
ALTER TABLE "invitations" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "invitations" ADD PRIMARY KEY ("id");
ALTER TABLE "invitations" DROP COLUMN "team_id";
ALTER TABLE "invitations" RENAME COLUMN "new_team_id" TO "team_id";
ALTER TABLE "invitations" ALTER COLUMN "team_id" SET NOT NULL;
ALTER TABLE "invitations" DROP COLUMN "invited_by";
ALTER TABLE "invitations" RENAME COLUMN "new_invited_by" TO "invited_by";
ALTER TABLE "invitations" ALTER COLUMN "invited_by" SET NOT NULL;

-- Accounts
ALTER TABLE "accounts" DROP COLUMN "id";
ALTER TABLE "accounts" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "accounts" ADD PRIMARY KEY ("id");
ALTER TABLE "accounts" DROP COLUMN "user_id";
ALTER TABLE "accounts" RENAME COLUMN "new_user_id" TO "user_id";
ALTER TABLE "accounts" ALTER COLUMN "user_id" SET NOT NULL;

-- Integrations
ALTER TABLE "integrations" DROP COLUMN "id";
ALTER TABLE "integrations" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "integrations" ADD PRIMARY KEY ("id");
ALTER TABLE "integrations" DROP COLUMN "team_id";
ALTER TABLE "integrations" RENAME COLUMN "new_team_id" TO "team_id";
ALTER TABLE "integrations" ALTER COLUMN "team_id" SET NOT NULL;

-- Providers
ALTER TABLE "providers" DROP COLUMN "id";
ALTER TABLE "providers" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "providers" ADD PRIMARY KEY ("id");
ALTER TABLE "providers" DROP COLUMN "user_id";
ALTER TABLE "providers" RENAME COLUMN "new_user_id" TO "user_id";
ALTER TABLE "providers" DROP COLUMN "integration_id";
ALTER TABLE "providers" RENAME COLUMN "new_integration_id" TO "integration_id";
ALTER TABLE "providers" ALTER COLUMN "integration_id" SET NOT NULL;
-- Drop old publicId column (id itself is now UUID)
ALTER TABLE "providers" DROP COLUMN IF EXISTS "public_id";

-- Provider Locations
ALTER TABLE "provider_locations" DROP COLUMN "id";
ALTER TABLE "provider_locations" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "provider_locations" ADD PRIMARY KEY ("id");
ALTER TABLE "provider_locations" DROP COLUMN "provider_id";
ALTER TABLE "provider_locations" RENAME COLUMN "new_provider_id" TO "provider_id";
ALTER TABLE "provider_locations" ALTER COLUMN "provider_id" SET NOT NULL;

-- Booking Types
ALTER TABLE "booking_types" DROP COLUMN "id";
ALTER TABLE "booking_types" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "booking_types" ADD PRIMARY KEY ("id");
ALTER TABLE "booking_types" DROP COLUMN "provider_id";
ALTER TABLE "booking_types" RENAME COLUMN "new_provider_id" TO "provider_id";
ALTER TABLE "booking_types" ALTER COLUMN "provider_id" SET NOT NULL;
-- Drop old publicId column
ALTER TABLE "booking_types" DROP COLUMN IF EXISTS "public_id";

-- Availability Slots
ALTER TABLE "availability_slots" DROP COLUMN "id";
ALTER TABLE "availability_slots" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "availability_slots" ADD PRIMARY KEY ("id");
ALTER TABLE "availability_slots" DROP COLUMN "booking_type_id";
ALTER TABLE "availability_slots" RENAME COLUMN "new_booking_type_id" TO "booking_type_id";
ALTER TABLE "availability_slots" ALTER COLUMN "booking_type_id" SET NOT NULL;

-- Opening Hours
ALTER TABLE "opening_hours" DROP COLUMN "id";
ALTER TABLE "opening_hours" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "opening_hours" ADD PRIMARY KEY ("id");
ALTER TABLE "opening_hours" DROP COLUMN "provider_id";
ALTER TABLE "opening_hours" RENAME COLUMN "new_provider_id" TO "provider_id";
ALTER TABLE "opening_hours" ALTER COLUMN "provider_id" SET NOT NULL;

-- Customer Leads
ALTER TABLE "customer_leads" DROP COLUMN "id";
ALTER TABLE "customer_leads" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "customer_leads" ADD PRIMARY KEY ("id");

-- Bookings
ALTER TABLE "bookings" DROP COLUMN "id";
ALTER TABLE "bookings" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "bookings" ADD PRIMARY KEY ("id");
ALTER TABLE "bookings" DROP COLUMN "provider_id";
ALTER TABLE "bookings" RENAME COLUMN "new_provider_id" TO "provider_id";
ALTER TABLE "bookings" ALTER COLUMN "provider_id" SET NOT NULL;
ALTER TABLE "bookings" DROP COLUMN "booking_type_id";
ALTER TABLE "bookings" RENAME COLUMN "new_booking_type_id" TO "booking_type_id";
ALTER TABLE "bookings" ALTER COLUMN "booking_type_id" SET NOT NULL;
ALTER TABLE "bookings" DROP COLUMN "customer_lead_id";
ALTER TABLE "bookings" RENAME COLUMN "new_customer_lead_id" TO "customer_lead_id";
ALTER TABLE "bookings" ALTER COLUMN "customer_lead_id" SET NOT NULL;
-- Drop old publicId column
ALTER TABLE "bookings" DROP COLUMN IF EXISTS "public_id";

-- Webhook Logs
ALTER TABLE "webhook_logs" DROP COLUMN "id";
ALTER TABLE "webhook_logs" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "webhook_logs" ADD PRIMARY KEY ("id");
ALTER TABLE "webhook_logs" DROP COLUMN "integration_id";
ALTER TABLE "webhook_logs" RENAME COLUMN "new_integration_id" TO "integration_id";--> statement-breakpoint

-- Step 8: Recreate all FK constraints
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "providers" ADD CONSTRAINT "providers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "providers" ADD CONSTRAINT "providers_integration_id_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "provider_locations" ADD CONSTRAINT "provider_locations_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "booking_types" ADD CONSTRAINT "booking_types_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_booking_type_id_booking_types_id_fk" FOREIGN KEY ("booking_type_id") REFERENCES "booking_types"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "opening_hours" ADD CONSTRAINT "opening_hours_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_booking_type_id_booking_types_id_fk" FOREIGN KEY ("booking_type_id") REFERENCES "booking_types"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_lead_id_customer_leads_id_fk" FOREIGN KEY ("customer_lead_id") REFERENCES "customer_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- Step 9: Recreate unique constraints
ALTER TABLE "providers" ADD CONSTRAINT "providers_integration_id_unique" UNIQUE("integration_id");
ALTER TABLE "provider_locations" ADD CONSTRAINT "provider_locations_provider_id_unique" UNIQUE("provider_id");--> statement-breakpoint

-- Step 10: Recreate indexes
CREATE INDEX "bookings_provider_status_idx" ON "bookings" USING btree ("provider_id","status");
CREATE INDEX "bookings_date_idx" ON "bookings" USING btree ("date");
CREATE INDEX "bookings_external_id_idx" ON "bookings" USING btree ("external_booking_id");
CREATE UNIQUE INDEX "booking_types_provider_external_idx" ON "booking_types" USING btree ("provider_id","external_id");
CREATE INDEX "booking_types_provider_active_idx" ON "booking_types" USING btree ("provider_id","is_active");
CREATE UNIQUE INDEX "availability_slots_unique_idx" ON "availability_slots" USING btree ("booking_type_id","date","start_time");
CREATE INDEX "availability_slots_date_time_idx" ON "availability_slots" USING btree ("date","start_time");
CREATE INDEX "availability_slots_expires_idx" ON "availability_slots" USING btree ("expires_at");
CREATE UNIQUE INDEX "opening_hours_provider_date_idx" ON "opening_hours" USING btree ("provider_id","date");
CREATE INDEX "providers_status_idx" ON "providers" USING btree ("status");
CREATE INDEX "providers_dashboard_email_idx" ON "providers" USING btree ("dashboard_email");
CREATE INDEX "providers_user_id_idx" ON "providers" USING btree ("user_id");

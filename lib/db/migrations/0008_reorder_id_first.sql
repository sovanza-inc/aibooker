-- Migration: Reorder columns so 'id' is the first column in every table.
-- PostgreSQL doesn't support ALTER TABLE REORDER, so we recreate each table.
-- Order: leaf tables first (no incoming FKs), then parent tables.

-- ============================================================
-- 1. Drop ALL foreign key constraints
-- ============================================================
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

-- Drop unique constraints
ALTER TABLE "providers" DROP CONSTRAINT IF EXISTS "providers_integration_id_unique";
ALTER TABLE "provider_locations" DROP CONSTRAINT IF EXISTS "provider_locations_provider_id_unique";--> statement-breakpoint

-- Drop all indexes (will be recreated)
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
DROP INDEX IF EXISTS "providers_user_id_idx";
DROP INDEX IF EXISTS "provider_locations_city_idx";
DROP INDEX IF EXISTS "provider_locations_geo_idx";
DROP INDEX IF EXISTS "customer_leads_email_idx";
DROP INDEX IF EXISTS "customer_leads_phone_idx";
DROP INDEX IF EXISTS "webhook_logs_source_event_idx";
DROP INDEX IF EXISTS "webhook_logs_status_idx";
DROP INDEX IF EXISTS "integrations_source_external_id_idx";
DROP INDEX IF EXISTS "accounts_provider_account_idx";--> statement-breakpoint

-- ============================================================
-- 2. Recreate each table with id as first column
-- ============================================================

-- USERS
CREATE TABLE "users_new" (
  "id" uuid PRIMARY KEY,
  "name" varchar(100),
  "email" varchar(255) NOT NULL UNIQUE,
  "password_hash" text,
  "role" varchar(20) NOT NULL DEFAULT 'provider',
  "image" text,
  "email_verified" timestamp,
  "auth_provider" varchar(20),
  "auth_provider_id" varchar(255),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "deleted_at" timestamp
);
INSERT INTO "users_new" SELECT "id","name","email","password_hash","role","image","email_verified","auth_provider","auth_provider_id","created_at","updated_at","deleted_at" FROM "users";
DROP TABLE "users";
ALTER TABLE "users_new" RENAME TO "users";--> statement-breakpoint

-- TEAMS
CREATE TABLE "teams_new" (
  "id" uuid PRIMARY KEY,
  "name" varchar(100) NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "stripe_customer_id" text UNIQUE,
  "stripe_subscription_id" text UNIQUE,
  "stripe_product_id" text,
  "plan_name" varchar(50),
  "subscription_status" varchar(20)
);
INSERT INTO "teams_new" SELECT "id","name","created_at","updated_at","stripe_customer_id","stripe_subscription_id","stripe_product_id","plan_name","subscription_status" FROM "teams";
DROP TABLE "teams";
ALTER TABLE "teams_new" RENAME TO "teams";--> statement-breakpoint

-- TEAM_MEMBERS
CREATE TABLE "team_members_new" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid NOT NULL,
  "team_id" uuid NOT NULL,
  "role" varchar(50) NOT NULL,
  "joined_at" timestamp NOT NULL DEFAULT now()
);
INSERT INTO "team_members_new" SELECT "id","user_id","team_id","role","joined_at" FROM "team_members";
DROP TABLE "team_members";
ALTER TABLE "team_members_new" RENAME TO "team_members";--> statement-breakpoint

-- ACTIVITY_LOGS
CREATE TABLE "activity_logs_new" (
  "id" uuid PRIMARY KEY,
  "team_id" uuid NOT NULL,
  "user_id" uuid,
  "action" text NOT NULL,
  "timestamp" timestamp NOT NULL DEFAULT now(),
  "ip_address" varchar(45)
);
INSERT INTO "activity_logs_new" SELECT "id","team_id","user_id","action","timestamp","ip_address" FROM "activity_logs";
DROP TABLE "activity_logs";
ALTER TABLE "activity_logs_new" RENAME TO "activity_logs";--> statement-breakpoint

-- INVITATIONS
CREATE TABLE "invitations_new" (
  "id" uuid PRIMARY KEY,
  "team_id" uuid NOT NULL,
  "email" varchar(255) NOT NULL,
  "role" varchar(50) NOT NULL,
  "invited_by" uuid NOT NULL,
  "invited_at" timestamp NOT NULL DEFAULT now(),
  "status" varchar(20) NOT NULL DEFAULT 'pending'
);
INSERT INTO "invitations_new" SELECT "id","team_id","email","role","invited_by","invited_at","status" FROM "invitations";
DROP TABLE "invitations";
ALTER TABLE "invitations_new" RENAME TO "invitations";--> statement-breakpoint

-- ACCOUNTS
CREATE TABLE "accounts_new" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid NOT NULL,
  "type" varchar(50) NOT NULL,
  "provider" varchar(50) NOT NULL,
  "provider_account_id" varchar(255) NOT NULL,
  "access_token" text,
  "refresh_token" text,
  "expires_at" integer,
  "token_type" varchar(50),
  "scope" text,
  "id_token" text
);
INSERT INTO "accounts_new" SELECT "id","user_id","type","provider","provider_account_id","access_token","refresh_token","expires_at","token_type","scope","id_token" FROM "accounts";
DROP TABLE "accounts";
ALTER TABLE "accounts_new" RENAME TO "accounts";--> statement-breakpoint

-- INTEGRATIONS
CREATE TABLE "integrations_new" (
  "id" uuid PRIMARY KEY,
  "team_id" uuid NOT NULL,
  "source" varchar(50) NOT NULL,
  "external_id" varchar(255) NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "api_key" varchar(255) NOT NULL UNIQUE,
  "webhook_secret" varchar(255) NOT NULL,
  "credentials" json,
  "activated_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
INSERT INTO "integrations_new" SELECT "id","team_id","source","external_id","status","api_key","webhook_secret","credentials","activated_at","created_at","updated_at" FROM "integrations";
DROP TABLE "integrations";
ALTER TABLE "integrations_new" RENAME TO "integrations";--> statement-breakpoint

-- PROVIDERS
CREATE TABLE "providers_new" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "integration_id" uuid NOT NULL UNIQUE,
  "name" varchar(255) NOT NULL,
  "slug" varchar(255) NOT NULL UNIQUE,
  "description" text,
  "cuisine_type" json DEFAULT '[]',
  "tags" json DEFAULT '[]',
  "phone" varchar(50),
  "email" varchar(255),
  "website" varchar(500),
  "price_range" integer,
  "rating" double precision,
  "status" varchar(20) NOT NULL DEFAULT 'onboarding',
  "dashboard_email" varchar(255) UNIQUE,
  "logo" varchar(500),
  "about_company" text,
  "what_is_this_business" text,
  "what_can_i_book_here" text,
  "when_should_recommend" text,
  "what_can_customers_book" json DEFAULT '[]',
  "best_for" json DEFAULT '[]',
  "atmosphere" json DEFAULT '[]',
  "what_makes_unique" text,
  "when_should_choose" text,
  "when_should_not_choose" text,
  "popular_dishes" text,
  "min_guest_size" integer DEFAULT 1,
  "max_guest_size" integer DEFAULT 20,
  "price_range_from" double precision,
  "price_range_to" double precision,
  "target_audience" json DEFAULT '[]',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
INSERT INTO "providers_new" SELECT "id","user_id","integration_id","name","slug","description","cuisine_type","tags","phone","email","website","price_range","rating","status","dashboard_email","logo","about_company","what_is_this_business","what_can_i_book_here","when_should_recommend","what_can_customers_book","best_for","atmosphere","what_makes_unique","when_should_choose","when_should_not_choose","popular_dishes","min_guest_size","max_guest_size","price_range_from","price_range_to","target_audience","created_at","updated_at" FROM "providers";
DROP TABLE "providers";
ALTER TABLE "providers_new" RENAME TO "providers";--> statement-breakpoint

-- PROVIDER_LOCATIONS
CREATE TABLE "provider_locations_new" (
  "id" uuid PRIMARY KEY,
  "provider_id" uuid NOT NULL UNIQUE,
  "street_address" varchar(500) NOT NULL,
  "city" varchar(255) NOT NULL,
  "postal_code" varchar(20) NOT NULL,
  "country" varchar(10) NOT NULL DEFAULT 'NL',
  "latitude" double precision NOT NULL,
  "longitude" double precision NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
INSERT INTO "provider_locations_new" SELECT "id","provider_id","street_address","city","postal_code","country","latitude","longitude","created_at","updated_at" FROM "provider_locations";
DROP TABLE "provider_locations";
ALTER TABLE "provider_locations_new" RENAME TO "provider_locations";--> statement-breakpoint

-- BOOKING_TYPES
CREATE TABLE "booking_types_new" (
  "id" uuid PRIMARY KEY,
  "provider_id" uuid NOT NULL,
  "external_id" varchar(255) NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text,
  "category" varchar(100) DEFAULT 'restaurant',
  "min_party_size" integer NOT NULL DEFAULT 1,
  "max_party_size" integer NOT NULL DEFAULT 20,
  "duration" integer NOT NULL DEFAULT 120,
  "average_price_per_person" double precision,
  "is_active" boolean NOT NULL DEFAULT true,
  "settings" json,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
INSERT INTO "booking_types_new" SELECT "id","provider_id","external_id","name","description","category","min_party_size","max_party_size","duration","average_price_per_person","is_active","settings","created_at","updated_at" FROM "booking_types";
DROP TABLE "booking_types";
ALTER TABLE "booking_types_new" RENAME TO "booking_types";--> statement-breakpoint

-- AVAILABILITY_SLOTS
CREATE TABLE "availability_slots_new" (
  "id" uuid PRIMARY KEY,
  "booking_type_id" uuid NOT NULL,
  "date" timestamp NOT NULL,
  "start_time" varchar(10) NOT NULL,
  "end_time" varchar(10) NOT NULL,
  "capacity" integer NOT NULL,
  "max_party_size" integer,
  "external_id" varchar(255),
  "last_synced_at" timestamp NOT NULL DEFAULT now(),
  "expires_at" timestamp NOT NULL
);
INSERT INTO "availability_slots_new" SELECT "id","booking_type_id","date","start_time","end_time","capacity","max_party_size","external_id","last_synced_at","expires_at" FROM "availability_slots";
DROP TABLE "availability_slots";
ALTER TABLE "availability_slots_new" RENAME TO "availability_slots";--> statement-breakpoint

-- OPENING_HOURS
CREATE TABLE "opening_hours_new" (
  "id" uuid PRIMARY KEY,
  "provider_id" uuid NOT NULL,
  "date" timestamp NOT NULL,
  "open_time" varchar(10),
  "close_time" varchar(10),
  "is_closed" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);
INSERT INTO "opening_hours_new" SELECT "id","provider_id","date","open_time","close_time","is_closed","created_at" FROM "opening_hours";
DROP TABLE "opening_hours";
ALTER TABLE "opening_hours_new" RENAME TO "opening_hours";--> statement-breakpoint

-- CUSTOMER_LEADS
CREATE TABLE "customer_leads_new" (
  "id" uuid PRIMARY KEY,
  "email" varchar(255),
  "phone" varchar(50),
  "first_name" varchar(100),
  "last_name" varchar(100),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
INSERT INTO "customer_leads_new" SELECT "id","email","phone","first_name","last_name","created_at","updated_at" FROM "customer_leads";
DROP TABLE "customer_leads";
ALTER TABLE "customer_leads_new" RENAME TO "customer_leads";--> statement-breakpoint

-- BOOKINGS
CREATE TABLE "bookings_new" (
  "id" uuid PRIMARY KEY,
  "provider_id" uuid NOT NULL,
  "booking_type_id" uuid NOT NULL,
  "customer_lead_id" uuid NOT NULL,
  "date" timestamp NOT NULL,
  "time" varchar(10) NOT NULL,
  "party_size" integer NOT NULL,
  "special_requests" text,
  "external_booking_id" varchar(255),
  "ai_session_id" varchar(255),
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "hold_expires_at" timestamp,
  "held_at" timestamp,
  "table_number" integer,
  "ai_platform" varchar(50),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "confirmed_at" timestamp,
  "cancelled_at" timestamp
);
INSERT INTO "bookings_new" SELECT "id","provider_id","booking_type_id","customer_lead_id","date","time","party_size","special_requests","external_booking_id","ai_session_id","status","hold_expires_at","held_at","table_number","ai_platform","created_at","updated_at","confirmed_at","cancelled_at" FROM "bookings";
DROP TABLE "bookings";
ALTER TABLE "bookings_new" RENAME TO "bookings";--> statement-breakpoint

-- WEBHOOK_LOGS
CREATE TABLE "webhook_logs_new" (
  "id" uuid PRIMARY KEY,
  "source" varchar(50) NOT NULL,
  "event_type" varchar(100) NOT NULL,
  "external_event_id" varchar(255),
  "integration_id" uuid,
  "payload" json NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'received',
  "error_message" text,
  "processed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);
INSERT INTO "webhook_logs_new" SELECT "id","source","event_type","external_event_id","integration_id","payload","status","error_message","processed_at","created_at" FROM "webhook_logs";
DROP TABLE "webhook_logs";
ALTER TABLE "webhook_logs_new" RENAME TO "webhook_logs";--> statement-breakpoint

-- ============================================================
-- 3. Recreate all FK constraints
-- ============================================================
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

-- ============================================================
-- 4. Recreate all indexes
-- ============================================================
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
CREATE INDEX "provider_locations_city_idx" ON "provider_locations" USING btree ("city");
CREATE INDEX "provider_locations_geo_idx" ON "provider_locations" USING btree ("latitude","longitude");
CREATE INDEX "customer_leads_email_idx" ON "customer_leads" USING btree ("email");
CREATE INDEX "customer_leads_phone_idx" ON "customer_leads" USING btree ("phone");
CREATE UNIQUE INDEX "webhook_logs_source_event_idx" ON "webhook_logs" USING btree ("source","external_event_id");
CREATE INDEX "webhook_logs_status_idx" ON "webhook_logs" USING btree ("status");
CREATE UNIQUE INDEX "integrations_source_external_id_idx" ON "integrations" USING btree ("source","external_id");
CREATE UNIQUE INDEX "accounts_provider_account_idx" ON "accounts" USING btree ("provider","provider_account_id");

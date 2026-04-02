CREATE TABLE "availability_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_type_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"start_time" varchar(10) NOT NULL,
	"end_time" varchar(10) NOT NULL,
	"capacity" integer NOT NULL,
	"max_party_size" integer,
	"external_id" varchar(255),
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" integer NOT NULL,
	"external_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"min_party_size" integer DEFAULT 1 NOT NULL,
	"max_party_size" integer DEFAULT 20 NOT NULL,
	"duration" integer DEFAULT 120 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"settings" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" integer NOT NULL,
	"booking_type_id" integer NOT NULL,
	"customer_lead_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"time" varchar(10) NOT NULL,
	"party_size" integer NOT NULL,
	"special_requests" text,
	"external_booking_id" varchar(255),
	"ai_session_id" varchar(255),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"hold_expires_at" timestamp,
	"held_at" timestamp,
	"ai_platform" varchar(50),
	"click_id" varchar(255),
	"lead_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp,
	"cancelled_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "customer_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"first_name" varchar(100),
	"last_name" varchar(100),
	"fingerprint" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_leads_fingerprint_unique" UNIQUE("fingerprint")
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"source" varchar(50) NOT NULL,
	"external_id" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"api_key" varchar(255) NOT NULL,
	"webhook_secret" varchar(255) NOT NULL,
	"credentials" json,
	"activated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "integrations_api_key_unique" UNIQUE("api_key")
);
--> statement-breakpoint
CREATE TABLE "provider_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" integer NOT NULL,
	"street_address" varchar(500) NOT NULL,
	"city" varchar(255) NOT NULL,
	"postal_code" varchar(20) NOT NULL,
	"country" varchar(10) DEFAULT 'NL' NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "provider_locations_provider_id_unique" UNIQUE("provider_id")
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"integration_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"cuisine_type" json DEFAULT '[]'::json,
	"tags" json DEFAULT '[]'::json,
	"phone" varchar(50),
	"email" varchar(255),
	"website" varchar(500),
	"price_range" integer,
	"rating" double precision,
	"status" varchar(20) DEFAULT 'onboarding' NOT NULL,
	"dashboard_email" varchar(255),
	"dashboard_password_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "providers_integration_id_unique" UNIQUE("integration_id"),
	CONSTRAINT "providers_slug_unique" UNIQUE("slug"),
	CONSTRAINT "providers_dashboard_email_unique" UNIQUE("dashboard_email")
);
--> statement-breakpoint
CREATE TABLE "webhook_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" varchar(50) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"external_event_id" varchar(255),
	"integration_id" integer,
	"payload" json NOT NULL,
	"status" varchar(20) DEFAULT 'received' NOT NULL,
	"error_message" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_booking_type_id_booking_types_id_fk" FOREIGN KEY ("booking_type_id") REFERENCES "public"."booking_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_types" ADD CONSTRAINT "booking_types_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_booking_type_id_booking_types_id_fk" FOREIGN KEY ("booking_type_id") REFERENCES "public"."booking_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_lead_id_customer_leads_id_fk" FOREIGN KEY ("customer_lead_id") REFERENCES "public"."customer_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_locations" ADD CONSTRAINT "provider_locations_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "providers" ADD CONSTRAINT "providers_integration_id_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "availability_slots_unique_idx" ON "availability_slots" USING btree ("booking_type_id","date","start_time");--> statement-breakpoint
CREATE INDEX "availability_slots_date_time_idx" ON "availability_slots" USING btree ("date","start_time");--> statement-breakpoint
CREATE INDEX "availability_slots_expires_idx" ON "availability_slots" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "booking_types_provider_external_idx" ON "booking_types" USING btree ("provider_id","external_id");--> statement-breakpoint
CREATE INDEX "booking_types_provider_active_idx" ON "booking_types" USING btree ("provider_id","is_active");--> statement-breakpoint
CREATE INDEX "bookings_provider_status_idx" ON "bookings" USING btree ("provider_id","status");--> statement-breakpoint
CREATE INDEX "bookings_date_idx" ON "bookings" USING btree ("date");--> statement-breakpoint
CREATE INDEX "bookings_external_id_idx" ON "bookings" USING btree ("external_booking_id");--> statement-breakpoint
CREATE INDEX "customer_leads_email_idx" ON "customer_leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX "customer_leads_phone_idx" ON "customer_leads" USING btree ("phone");--> statement-breakpoint
CREATE UNIQUE INDEX "integrations_source_external_id_idx" ON "integrations" USING btree ("source","external_id");--> statement-breakpoint
CREATE INDEX "provider_locations_city_idx" ON "provider_locations" USING btree ("city");--> statement-breakpoint
CREATE INDEX "provider_locations_geo_idx" ON "provider_locations" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "providers_status_idx" ON "providers" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_logs_source_event_idx" ON "webhook_logs" USING btree ("source","external_event_id");--> statement-breakpoint
CREATE INDEX "webhook_logs_status_idx" ON "webhook_logs" USING btree ("status");
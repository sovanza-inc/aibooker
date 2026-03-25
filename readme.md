The directory is empty -- this is a greenfield project. I have all the context I need from the requirements. Let me now design the complete implementation plan.

---

# AiBooker -- Complete Production-Level Implementation Plan

## Table of Contents
1. [Project Structure](#1-project-structure)
2. [Database Schema](#2-database-schema)
3. [Phased Implementation Roadmap](#3-phased-implementation-roadmap)
4. [API Layer Design](#4-api-layer-design)
5. [Search and Ranking Engine](#5-search-and-ranking-engine)
6. [Webhook Processing Architecture](#6-webhook-processing-architecture)
7. [Booking Flow (Partner Handles Payment + Email)](#7-booking-flow-payment--email-handled-by-partner)
8. [AI Tool Integration](#8-ai-tool-integration)
9. [Partner Dashboard](#9-partner-dashboard)
10. [Testing Strategy](#10-testing-strategy)
11. [Deployment and Infrastructure](#11-deployment-and-infrastructure)
12. [Security Considerations](#12-security-considerations)

---

## 1. Project Structure

```
AiBooker/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                        # Lint, typecheck, test on PR
│   │   ├── deploy-api.yml                # Deploy API on merge to main
│   │   └── deploy-dashboard.yml          # Deploy dashboard on merge to main
│   └── PULL_REQUEST_TEMPLATE.md
├── apps/
│   ├── api/                              # Node.js + TypeScript backend
│   │   ├── src/
│   │   │   ├── index.ts                  # Entry point, server bootstrap
│   │   │   ├── app.ts                    # Express/Fastify app setup
│   │   │   ├── config/
│   │   │   │   ├── index.ts              # Env config loader (dotenv + zod validation)
│   │   │   │   ├── database.ts           # DB connection config
│   │   │   │   └── logger.ts             # Pino logger config
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts               # API key / JWT validation
│   │   │   │   ├── webhookAuth.ts        # HMAC signature verification for webhooks
│   │   │   │   ├── aiPlatformAuth.ts     # Auth for AI tool calls (bearer token per platform)
│   │   │   │   ├── rateLimiter.ts        # Rate limiting per API key
│   │   │   │   ├── requestId.ts          # X-Request-Id propagation
│   │   │   │   ├── errorHandler.ts       # Global error handler
│   │   │   │   └── validateRequest.ts    # Zod schema validation middleware
│   │   │   ├── routes/
│   │   │   │   ├── index.ts              # Route aggregator
│   │   │   │   ├── health.ts             # GET /health, GET /ready
│   │   │   │   ├── v1/
│   │   │   │   │   ├── integrations.ts   # POST /v1/integrations/activate, /validate
│   │   │   │   │   ├── webhooks.ts       # POST /v1/webhooks/* (5 endpoints)
│   │   │   │   │   ├── ai-tools.ts       # POST /v1/ai/search, /availability, /book, /status
│   │   │   │   │   ├── providers.ts      # CRUD for partner dashboard
│   │   │   │   │   ├── bookings.ts       # Booking management for dashboard
│   │   │   │   │   ├── campaigns.ts      # Campaign CRUD for dashboard
│   │   │   │   │   ├── media.ts          # Media upload endpoints
│   │   │   │   │   └── analytics.ts      # Dashboard analytics endpoints
│   │   │   ├── controllers/
│   │   │   │   ├── integration.controller.ts
│   │   │   │   ├── webhook.controller.ts
│   │   │   │   ├── ai-tool.controller.ts
│   │   │   │   ├── provider.controller.ts
│   │   │   │   ├── booking.controller.ts
│   │   │   │   ├── campaign.controller.ts
│   │   │   │   ├── media.controller.ts
│   │   │   │   └── analytics.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── integration.service.ts    # Activation/validation logic
│   │   │   │   ├── webhook.service.ts        # Webhook processing + idempotency
│   │   │   │   ├── search.service.ts         # Search + ranking engine
│   │   │   │   ├── availability.service.ts   # Live availability check orchestration
│   │   │   │   ├── booking.service.ts        # Booking creation orchestration (delegates to partner for payment/email)
│   │   │   │   ├── provider.service.ts       # Provider CRUD
│   │   │   │   ├── campaign.service.ts       # Campaign management
│   │   │   │   ├── media.service.ts          # Media upload to S3/R2
│   │   │   │   ├── analytics.service.ts      # Metrics aggregation
│   │   │   │   └── ranking.service.ts        # Scoring algorithm
│   │   │   ├── connectors/
│   │   │   │   ├── base.connector.ts         # Abstract connector interface
│   │   │   │   ├── jimani.connector.ts       # Jimani API client
│   │   │   │   ├── zenchef.connector.ts      # Zenchef API client
│   │   │   │   └── connector.factory.ts      # Factory to resolve connector by integration
│   │   │   ├── jobs/
│   │   │   │   ├── queue.ts                  # BullMQ queue setup
│   │   │   │   ├── workers/
│   │   │   │   │   ├── webhook.worker.ts     # Process webhook events async
│   │   │   │   │   ├── booking.worker.ts     # Booking creation via partner connector
│   │   │   │   │   ├── campaign.worker.ts    # Budget depletion check, daily reset
│   │   │   │   │   └── analytics.worker.ts   # Aggregate daily stats
│   │   │   │   └── schedulers/
│   │   │   │       ├── staleSlotCleanup.ts   # Remove expired availability slots
│   │   │   │       ├── holdExpiry.ts         # Release expired booking holds (300s TTL) and restore availability
│   │   │   │       ├── availabilityPoll.ts   # Poll source platforms every 5 min to supplement webhooks
│   │   │   │       └── campaignBudgetReset.ts # Reset daily budgets at midnight CET
│   │   │   ├── schemas/                      # Zod validation schemas
│   │   │   │   ├── webhook.schema.ts
│   │   │   │   ├── ai-tool.schema.ts
│   │   │   │   ├── provider.schema.ts
│   │   │   │   ├── campaign.schema.ts
│   │   │   │   └── common.schema.ts
│   │   │   └── utils/
│   │   │       ├── geo.ts                    # Haversine distance calc
│   │   │       ├── hmac.ts                   # HMAC signature helpers
│   │   │       ├── pagination.ts             # Cursor-based pagination
│   │   │       └── idempotency.ts            # Idempotency key helpers
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── .env.example
│   │
│   └── dashboard/                            # Next.js partner dashboard
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx                # Root layout with auth provider
│       │   │   ├── page.tsx                  # Landing / login redirect
│       │   │   ├── (auth)/
│       │   │   │   ├── login/page.tsx
│       │   │   │   └── onboarding/page.tsx   # Post-integration activation flow
│       │   │   ├── (dashboard)/
│       │   │   │   ├── layout.tsx            # Dashboard shell (sidebar, topbar)
│       │   │   │   ├── overview/page.tsx     # Analytics overview
│       │   │   │   ├── profile/
│       │   │   │   │   ├── page.tsx          # Tab 1: Business info
│       │   │   │   │   └── booking-types/page.tsx  # Tab 2: Booking types
│       │   │   │   ├── media/page.tsx        # Media library
│       │   │   │   ├── bookings/
│       │   │   │   │   ├── page.tsx          # Booking list
│       │   │   │   │   └── [id]/page.tsx     # Booking detail
│       │   │   │   ├── campaigns/
│       │   │   │   │   ├── page.tsx          # Campaign list
│       │   │   │   │   └── new/page.tsx      # Create/edit campaign
│       │   │   │   ├── analytics/page.tsx    # Detailed analytics
│       │   │   │   └── settings/page.tsx     # Integration settings, billing
│       │   ├── components/
│       │   │   ├── ui/                       # shadcn/ui primitives
│       │   │   ├── forms/
│       │   │   │   ├── ProfileForm.tsx
│       │   │   │   ├── BookingTypeForm.tsx
│       │   │   │   ├── CampaignForm.tsx
│       │   │   │   └── MediaUploader.tsx
│       │   │   ├── tables/
│       │   │   │   ├── BookingsTable.tsx
│       │   │   │   └── CampaignsTable.tsx
│       │   │   ├── charts/
│       │   │   │   ├── BookingChart.tsx
│       │   │   │   └── RevenueChart.tsx
│       │   │   └── layout/
│       │   │       ├── Sidebar.tsx
│       │   │       ├── Topbar.tsx
│       │   │       └── OnboardingStepper.tsx
│       │   ├── lib/
│       │   │   ├── api.ts                    # API client (fetch wrapper)
│       │   │   ├── auth.ts                   # Auth helpers (session)
│       │   │   └── utils.ts
│       │   └── hooks/
│       │       ├── useProvider.ts
│       │       ├── useBookings.ts
│       │       └── useCampaigns.ts
│       ├── public/
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       ├── package.json
│       └── Dockerfile
│
├── packages/
│   ├── database/                             # Prisma schema + migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts                       # Seed data for dev
│   │   ├── src/
│   │   │   └── index.ts                      # Re-export PrismaClient
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── shared/                               # Shared types, utils, constants
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── provider.ts
│   │   │   │   ├── booking.ts
│   │   │   │   ├── availability.ts
│   │   │   │   ├── campaign.ts
│   │   │   │   ├── ai-tool.ts               # AI tool request/response types
│   │   │   │   ├── webhook.ts
│   │   │   │   └── integration.ts
│   │   │   ├── constants/
│   │   │   │   ├── cuisineTypes.ts
│   │   │   │   ├── tags.ts
│   │   │   │   ├── bookingStatuses.ts
│   │   │   │   └── errorCodes.ts
│   │   │   ├── utils/
│   │   │   │   ├── date.ts                   # Date/timezone helpers (CET)
│   │   │   │   └── money.ts                  # Cents-based money arithmetic
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── connectors/                           # Connector interfaces + implementations
│       ├── src/
│       │   ├── types.ts                      # IConnector interface
│       │   ├── jimani/
│       │   │   ├── client.ts                 # HTTP client for Jimani API
│       │   │   ├── mapper.ts                 # Map Jimani DTOs ↔ AiBooker models
│       │   │   └── index.ts
│       │   ├── zenchef/
│       │   │   ├── client.ts
│       │   │   ├── mapper.ts
│       │   │   └── index.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── docs/
│   ├── architecture.md                       # System architecture overview
│   ├── api/
│   │   ├── public-integration-api.yaml       # OpenAPI 3.1 spec
│   │   ├── ai-tool-api.yaml                  # OpenAPI spec for AI tools
│   │   └── source-connector-api.yaml         # OpenAPI spec
│   ├── flows/
│   │   ├── onboarding-flow.md
│   │   └── booking-flow.md
│   └── runbooks/
│       ├── deployment.md
│       └── incident-response.md
│
├── turbo.json                                # Turborepo config
├── package.json                              # Root workspace config
├── pnpm-workspace.yaml                       # pnpm workspace definition
├── tsconfig.base.json                        # Shared TS config
├── .env.example
├── .gitignore
├── .eslintrc.js
├── .prettierrc
├── docker-compose.yml                        # Local dev: Postgres + Redis
└── README.md
```

---

## 2. Database Schema (Prisma)

Below is the complete `schema.prisma`. All monetary values are stored in **cents** (integer). All timestamps are UTC. The schema uses PostgreSQL-specific features (PostGIS-ready via lat/lng floats, JSONB via `Json` type).

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ──────────────────────────────────────────────
// INTEGRATIONS (links external platforms to AiBooker)
// ──────────────────────────────────────────────
model Integration {
  id              String   @id @default(cuid())
  source          String   // "jimani" | "zenchef"
  externalId      String   // Restaurant ID on the source platform
  status          String   @default("pending") // pending | active | suspended | deactivated
  apiKey          String   @unique @default(cuid()) // AiBooker issues this to the source
  webhookSecret   String   // HMAC secret for verifying webhook payloads
  credentials     Json?    // Encrypted credentials for calling source API back
  activatedAt     DateTime?
  deactivatedAt   DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  provider        Provider?

  @@unique([source, externalId])
  @@index([status])
  @@map("integrations")
}

// ──────────────────────────────────────────────
// PROVIDERS (restaurant base data)
// ──────────────────────────────────────────────
model Provider {
  id                String   @id @default(cuid())
  integrationId     String   @unique
  integration       Integration @relation(fields: [integrationId], references: [id])

  name              String
  slug              String   @unique // URL-friendly identifier
  description       String?  @db.Text
  cuisineType       String[] // ["italian", "pizza", "mediterranean"]
  phone             String?
  email             String?
  website           String?
  priceRange        Int?     // 1-4 (€ to €€€€)
  rating            Float?   // Aggregated rating (0-5)
  profileComplete   Float    @default(0) // 0-1 completeness score

  status            String   @default("onboarding") // onboarding | active | paused | suspended
  onboardingStep    Int      @default(1) // Track onboarding progress

  // Dashboard auth
  dashboardEmail    String?  @unique
  dashboardPasswordHash String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  location          ProviderLocation?
  bookingTypes      BookingType[]
  media             ProviderMedia[]
  tags              ProviderTag[]
  bookings          Booking[]
  campaigns         Campaign[]
  analyticsDaily    AnalyticsDaily[]

  @@index([status])
  @@index([cuisineType], type: Gin)
  @@map("providers")
}

// ──────────────────────────────────────────────
// PROVIDER LOCATIONS
// ──────────────────────────────────────────────
model ProviderLocation {
  id            String   @id @default(cuid())
  providerId    String   @unique
  provider      Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  streetAddress String
  city          String
  postalCode    String
  country       String   @default("NL")
  latitude      Float
  longitude     Float

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([city])
  @@index([latitude, longitude])
  @@map("provider_locations")
}

// ──────────────────────────────────────────────
// BOOKING TYPES (lunch, diner, groepsreservering)
// ──────────────────────────────────────────────
model BookingType {
  id              String   @id @default(cuid())
  providerId      String
  provider        Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  externalId      String   // ID on the source platform
  name            String   // "Lunch", "Diner", "Groepsreservering"
  description     String?  @db.Text
  minPartySize    Int      @default(1)
  maxPartySize    Int      @default(20)
  duration        Int      @default(120) // Default duration in minutes
  isActive        Boolean  @default(true)

  settings        Json?    // Extra source-specific settings

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  availabilitySlots AvailabilitySlot[]
  bookings          Booking[]
  media             ProviderMedia[]

  @@unique([providerId, externalId])
  @@index([providerId, isActive])
  @@map("booking_types")
}

// ──────────────────────────────────────────────
// PROVIDER MEDIA
// ──────────────────────────────────────────────
model ProviderMedia {
  id            String   @id @default(cuid())
  providerId    String
  provider      Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  bookingTypeId String?  // null = provider-level media
  bookingType   BookingType? @relation(fields: [bookingTypeId], references: [id], onDelete: SetNull)

  type          String   // "image" | "pdf" | "menu"
  url           String
  altText       String?
  sortOrder     Int      @default(0)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([providerId])
  @@map("provider_media")
}

// ──────────────────────────────────────────────
// PROVIDER TAGS
// ──────────────────────────────────────────────
model ProviderTag {
  id         String   @id @default(cuid())
  providerId String
  provider   Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  tag        String   // "romantic", "terrace", "kid-friendly", "wheelchair-accessible"

  @@unique([providerId, tag])
  @@index([tag])
  @@map("provider_tags")
}

// ──────────────────────────────────────────────
// AVAILABILITY SLOTS (real-time from webhooks)
// ──────────────────────────────────────────────
model AvailabilitySlot {
  id              String   @id @default(cuid())
  bookingTypeId   String
  bookingType     BookingType @relation(fields: [bookingTypeId], references: [id], onDelete: Cascade)

  date            DateTime @db.Date
  startTime       String   // "18:00" (HH:mm, local time)
  endTime         String   // "20:00"
  capacity        Int      // Remaining covers
  maxPartySize    Int?     // Override per slot

  externalId      String?  // Slot ID on source platform
  lastSyncedAt    DateTime @default(now())
  expiresAt       DateTime // Auto-cleanup: slots older than this are stale

  @@unique([bookingTypeId, date, startTime])
  @@index([date, startTime])
  @@index([expiresAt])
  @@map("availability_slots")
}

// ──────────────────────────────────────────────
// BOOKINGS
// ──────────────────────────────────────────────
model Booking {
  id              String   @id @default(cuid())
  providerId      String
  provider        Provider @relation(fields: [providerId], references: [id])
  bookingTypeId   String
  bookingType     BookingType @relation(fields: [bookingTypeId], references: [id])
  customerLeadId  String
  customerLead    CustomerLead @relation(fields: [customerLeadId], references: [id])

  // Booking details
  date            DateTime @db.Date
  time            String   // "19:30"
  partySize       Int
  specialRequests String?  @db.Text

  // External references
  externalBookingId String? // Booking ID on source platform
  aiSessionId       String? // AI conversation reference

  // Status
  status          String   @default("pending")
  // pending | held | confirmed | cancelled | no_show | completed

  // Booking hold (slot reservation while partner processes)
  holdExpiresAt   DateTime?  // Hold expires after 300 seconds (5 min)
  heldAt          DateTime?  // When the hold was created

  // Source tracking (attribution from Miro: campaign type, click ID, lead ID)
  aiPlatform      String?  // "openai" | "gemini" | "grok"
  campaignId      String?  // Which campaign drove this booking
  campaign        Campaign? @relation(fields: [campaignId], references: [id])
  clickId         String?  // Unique click ID for attribution tracking
  leadId          String?  // Lead ID linking to the originating search/interaction

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  confirmedAt     DateTime?
  cancelledAt     DateTime?

  @@index([providerId, status])
  @@index([date])
  @@index([customerLeadId])
  @@index([externalBookingId])
  @@map("bookings")
}

// ──────────────────────────────────────────────
// CUSTOMER LEADS
// ──────────────────────────────────────────────
model CustomerLead {
  id            String   @id @default(cuid())
  email         String?
  phone         String?
  firstName     String?
  lastName      String?

  // Hashed identifier for dedup across AI platforms
  fingerprint   String?  @unique

  totalBookings Int      @default(0)
  lastBookingAt DateTime?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  bookings      Booking[]

  @@index([email])
  @@index([phone])
  @@map("customer_leads")
}

// ──────────────────────────────────────────────
// CAMPAIGNS (Google Ads-like model)
// ──────────────────────────────────────────────
model Campaign {
  id              String   @id @default(cuid())
  providerId      String
  provider        Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  name            String
  type            String   @default("cpc") // "cpc" | "cpa"
  status          String   @default("draft") // draft | active | paused | exhausted | ended

  // Bidding
  bidAmountCents  Int      // Bid per click or per acquisition, in cents
  dailyBudgetCents Int     // Max daily spend in cents
  totalBudgetCents Int?    // Optional total budget cap

  // Spend tracking
  dailySpentCents  Int     @default(0)
  totalSpentCents  Int     @default(0)

  // Targeting
  targetCities    String[] // ["amsterdam", "rotterdam"]
  targetCuisines  String[] // [] = all
  targetTags      String[] // [] = all
  targetTimeSlots String[] // ["lunch", "dinner"] or [] = all

  startsAt        DateTime
  endsAt          DateTime?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  bookings        Booking[]

  @@index([providerId, status])
  @@index([status, startsAt, endsAt])
  @@map("campaigns")
}

// ──────────────────────────────────────────────
// WEBHOOK LOG (idempotency + audit trail)
// ──────────────────────────────────────────────
model WebhookLog {
  id              String   @id @default(cuid())
  source          String   // "jimani" | "zenchef"
  eventType       String   // "provider-updated" | "booking-types-updated" etc.
  externalEventId String?  // Idempotency key from source
  integrationId   String?
  payload         Json
  status          String   @default("received") // received | processing | processed | failed
  errorMessage    String?  @db.Text
  processedAt     DateTime?
  createdAt       DateTime @default(now())

  @@unique([source, externalEventId])
  @@index([status])
  @@index([createdAt])
  @@map("webhook_logs")
}

// ──────────────────────────────────────────────
// ANALYTICS (pre-aggregated daily stats per provider)
// ──────────────────────────────────────────────
model AnalyticsDaily {
  id              String   @id @default(cuid())
  providerId      String
  provider        Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  date            DateTime @db.Date
  impressions     Int      @default(0) // Times shown in search
  clicks          Int      @default(0) // Times selected by user
  bookings        Int      @default(0) // Confirmed bookings
  revenue         Int      @default(0) // Revenue in cents
  adSpend         Int      @default(0) // Ad spend in cents

  @@unique([providerId, date])
  @@map("analytics_daily")
}
```

### Key Schema Design Decisions

- **cuid() for IDs**: URL-safe, sortable, no collisions across distributed systems.
- **Cents for money**: All `Int` fields for amounts avoid floating-point issues.
- **AvailabilitySlot with expiresAt**: Stale slot cleanup via scheduled job; webhooks refresh these.
- **WebhookLog with externalEventId uniqueness**: Idempotency guarantee -- replay a webhook and it is a no-op.
- **AnalyticsDaily pre-aggregation**: Avoids expensive joins at dashboard query time.
- **Campaign daily/total spend tracking**: Enables real-time budget enforcement during search ranking.
- **Integration.credentials as encrypted Json**: Stores API keys/tokens for calling back to Jimani/Zenchef. Encrypt at rest using application-level encryption (AES-256-GCM) before storing.
- **Booking.holdExpiresAt for slot reservation**: 300-second TTL hold prevents double-booking while partner processes. Expired holds are auto-released by a scheduler.
- **Booking.clickId + leadId for attribution**: Full source tracking chain from search impression → click → lead → booking, aligned with the Miro integration spec.

---

## 3. Phased Implementation Roadmap

### Phase 1: Foundation + Integration + Webhooks (Week 1-2)

**Goal**: Monorepo up, Jimani can activate and push data, search + ranking works.

| Task | Details | Owner |
|------|---------|-------|
| Monorepo setup | pnpm workspaces + Turborepo, Docker Compose (PG 16 + Redis 7), CI pipeline | Dev A |
| Prisma schema + shared package | Full schema, migration, types, constants, error codes | Dev B |
| API skeleton | Fastify app, health endpoint, config loader, Pino logger | Dev A |
| Dashboard skeleton | Next.js 14 App Router, Tailwind, shadcn/ui init | Dev B |
| Integration activation | `POST /v1/integrations/activate` + `/validate` (Layer 1) | Dev A |
| Webhook auth + receivers | HMAC-SHA256 middleware, all 5 webhook routes with Zod validation (Layer 1 + 3) | Dev B |
| Webhook processing | BullMQ queue, idempotency, payload mapping, DB upserts, webhook log | Dev A |
| Jimani connector (read) | `GET /restaurants/{id}` client + mapper | Dev B |
| Search + ranking service | Filter by city/cuisine/time/partySize/tags, relevance + quality + ad_boost scoring, geo distance | Dev A |
| AI tool auth + search endpoint | Bearer token per platform, `POST /v1/ai/search`, response formatting | Dev B |
| Integration tests | Jimani activation + webhook push + search returns ranked results | Both |

**Exit criteria**: `pnpm dev` starts both apps. Jimani data flows in via webhooks. `POST /v1/ai/search` returns scored + sorted results.

### Phase 2: Booking Flow + AI Platform Integration (Week 3-4)

**Goal**: End-to-end booking with hold, partner handoff, AI function calling specs.

| Task | Details | Owner |
|------|---------|-------|
| Jimani availability connector | `POST /v1/aibooker/availability/check` (Layer 2) — alternative time slots | Dev A |
| Jimani booking connector | `POST /v1/aibooker/bookings` (Layer 2) — source attribution (campaign_type, click_id, lead_id) | Dev B |
| Availability check endpoint | `POST /v1/ai/availability` — local slot check + live Jimani check | Dev B |
| Booking creation + hold | `POST /v1/ai/book` — 300s TTL hold + partner handoff, customer lead dedup | Dev A |
| Booking status endpoint | `GET /v1/ai/booking-status` | Dev B |
| Hold expiry scheduler | Release expired holds every 30s, restore capacity | Dev A |
| Availability polling | 5-min polling scheduler to supplement webhooks | Dev A |
| Campaign lookup in ranking | Fetch active campaigns, compute ad_boost | Dev B |
| OpenAI + Gemini specs | Function calling schemas for all 4 tools, Actions config, response optimization | Dev A |
| Rate limiting per platform | Separate limits for AI platforms, dashboard, webhooks | Dev B |
| Integration tests | Full flow: search → availability → hold → book → partner confirm/reject → status | Both |

**Exit criteria**: Full booking loop works. OpenAI Actions + Gemini function declarations validated. Holds expire correctly.

### Phase 3: Partner Dashboard (Week 5-6)

**Goal**: Restaurants onboard via Jimani, manage profiles, run campaigns, view analytics.

| Task | Details | Owner |
|------|---------|-------|
| Dashboard auth | Magic link continuation from Jimani (15-min token) + email/password login | Dev B |
| Onboarding flow | 3-step stepper: Verify business info → Configure booking types + media → Go live | Dev B |
| Profile management | Business info (editable), location (editable), tags (editable), booking types (read-only from partner except description/media) | Dev B |
| Media upload | S3/R2 presigned URL upload, drag-and-drop, per-booking-type images | Dev A |
| Bookings list + detail | Paginated table with filters, status badges, booking detail view | Dev B |
| Campaign management | CRUD for campaigns with CPC/CPA bid + budget config | Dev A |
| Analytics overview | Charts: impressions, clicks, bookings, revenue, ad spend | Dev A |
| Dashboard API endpoints | Provider CRUD, campaign CRUD, analytics queries | Dev A |
| Integration tests | Onboarding flow, profile save, campaign creation | Both |

**Exit criteria**: Restaurant completes onboarding. Can manage profile, view bookings, create campaigns.

### Phase 4: Zenchef + Hardening + Launch (Week 7)

**Goal**: Second connector, production-ready, UAT.

| Task | Details | Owner |
|------|---------|-------|
| Zenchef connector | Webhook mapping + API client (availability check + booking) | Dev A + B |
| Connector factory | Resolve correct connector based on `integration.source` | Dev A |
| Load testing + security audit | k6 scripts, OWASP review, `pnpm audit` | Dev A |
| Monitoring + error tracking | Pino structured logs, Sentry, UptimeRobot, alerting | Dev B |
| Staging deployment | Full stack on staging, documentation (OpenAPI, runbooks) | Dev A |
| UAT with Jimani | Test with real Jimani test environment | Both |

**Exit criteria**: Both connectors working. Staging deployed. Load tested. Security audited. Ready for production.

**Total timeline: 7 weeks.**

---

## 4. API Layer Design

### Framework Choice: Fastify

Fastify over Express for: native TypeScript support, schema-based validation (integrates with Zod via `fastify-type-provider-zod`), 2-3x better throughput, built-in JSON serialization optimization.

### API Structure

```
/health                           GET    Health check
/ready                            GET    Readiness check (DB + Redis)

/v1/integrations/activate         POST   Source platform activates integration
/v1/integrations/validate         POST   Source platform validates connection

/v1/webhooks/provider-updated     POST   Webhook: provider data changed
/v1/webhooks/booking-types-updated POST  Webhook: booking types changed
/v1/webhooks/availability-updated POST   Webhook: availability slots changed
/v1/webhooks/booking-updated      POST   Webhook: booking status changed
/v1/webhooks/booking-email-updated POST  Webhook: booking email settings changed

/v1/ai/search                     POST   AI tool: search restaurants
/v1/ai/availability               POST   AI tool: check live availability
/v1/ai/book                       POST   AI tool: create booking (+ payment)
/v1/ai/booking-status             POST   AI tool: get booking status

/v1/dashboard/auth/login          POST   Dashboard: email/password login
/v1/dashboard/auth/refresh        POST   Dashboard: refresh JWT
/v1/dashboard/providers/me        GET    Dashboard: get own profile
/v1/dashboard/providers/me        PUT    Dashboard: update profile
/v1/dashboard/providers/me/location PUT  Dashboard: update location
/v1/dashboard/providers/me/tags   PUT    Dashboard: update tags
/v1/dashboard/booking-types       GET    Dashboard: list booking types
/v1/dashboard/booking-types/:id   PUT    Dashboard: update booking type
/v1/dashboard/media               GET    Dashboard: list media
/v1/dashboard/media/upload-url    POST   Dashboard: get presigned upload URL
/v1/dashboard/media               POST   Dashboard: register uploaded media
/v1/dashboard/media/:id           DELETE Dashboard: delete media
/v1/dashboard/bookings            GET    Dashboard: list bookings (paginated)
/v1/dashboard/bookings/:id        GET    Dashboard: booking detail
/v1/dashboard/campaigns           GET    Dashboard: list campaigns
/v1/dashboard/campaigns           POST   Dashboard: create campaign
/v1/dashboard/campaigns/:id       PUT    Dashboard: update campaign
/v1/dashboard/campaigns/:id       DELETE Dashboard: delete campaign
/v1/dashboard/analytics/overview  GET    Dashboard: analytics summary
/v1/dashboard/analytics/daily     GET    Dashboard: daily metrics (date range)
```

### Authentication Model

Three distinct auth mechanisms, each as a separate Fastify plugin/middleware:

1. **Webhook Auth** (`webhookAuth.ts`): HMAC-SHA256 signature in `X-Webhook-Signature` header. Each Integration has a unique `webhookSecret`. The middleware: (a) reads the raw body, (b) computes `HMAC-SHA256(webhookSecret, rawBody)`, (c) compares with the header using `crypto.timingSafeEqual`.

2. **AI Platform Auth** (`aiPlatformAuth.ts`): Bearer token in `Authorization` header. AiBooker issues a static API key per AI platform (stored in env vars: `OPENAI_API_KEY`, `GEMINI_API_KEY`). The middleware validates and sets `req.aiPlatform` to identify the caller.

3. **Dashboard Auth** (`auth.ts`): JWT (access token 15min + refresh token 7d). The JWT payload contains `{ providerId, email }`. Access token in `Authorization: Bearer` header. Refresh token in httpOnly cookie.

### Error Response Format

All errors follow a consistent format:

```typescript
{
  error: {
    code: "VALIDATION_ERROR",        // Machine-readable error code
    message: "Party size exceeds maximum", // Human-readable message
    details?: [                       // Optional field-level errors
      { field: "partySize", message: "Must be between 1 and 20" }
    ],
    requestId: "req_abc123"          // For debugging/support
  }
}
```

### Rate Limiting

Using `@fastify/rate-limit` with Redis backend:

| Endpoint Group | Limit | Window |
|---|---|---|
| Webhooks | 1000 req/min per integration | 1 minute |
| AI tools | 300 req/min per platform | 1 minute |
| Dashboard | 100 req/min per provider | 1 minute |
| Integration activation | 10 req/hour per IP | 1 hour |

---

## 5. Search and Ranking Engine Design

### Search Pipeline

```
Request → Parse Filters → Query DB → Score Results → Sort → Paginate → Format Response
```

### Step 1: Parse Filters

Input (from AI tool call):
```typescript
interface SearchRequest {
  query?: string;           // Free text: "Italian restaurant Amsterdam"
  city?: string;            // "amsterdam"
  cuisine?: string[];       // ["italian"]
  date: string;             // "2026-03-25"
  time: string;             // "19:30"
  partySize: number;        // 4
  tags?: string[];          // ["terrace", "romantic"]
  latitude?: number;        // User's location for distance ranking
  longitude?: number;
  maxDistanceKm?: number;   // Default 10
  page?: number;            // Default 1
  pageSize?: number;        // Default 10, max 20
}
```

If `query` is provided but individual fields are not, use basic NLP extraction (or rely on the AI platform to have already extracted fields -- preferred approach since ChatGPT/Gemini parse natural language before calling the function).

### Step 2: Database Query

Use Prisma with raw SQL for performance-critical parts. The query:

```sql
SELECT p.*, pl.latitude, pl.longitude, pl.city,
       COUNT(DISTINCT avs.id) as available_slot_count
FROM providers p
JOIN provider_locations pl ON pl.provider_id = p.id
JOIN booking_types bt ON bt.provider_id = p.id AND bt.is_active = true
LEFT JOIN availability_slots avs ON avs.booking_type_id = bt.id
  AND avs.date = $date
  AND avs.start_time <= $time
  AND avs.end_time > $time
  AND avs.capacity >= $partySize
  AND avs.expires_at > NOW()
WHERE p.status = 'active'
  AND ($city IS NULL OR LOWER(pl.city) = LOWER($city))
  AND ($cuisines IS NULL OR p.cuisine_type && $cuisines)  -- array overlap
  AND bt.min_party_size <= $partySize
  AND bt.max_party_size >= $partySize
  AND ($tags IS NULL OR EXISTS (
    SELECT 1 FROM provider_tags pt
    WHERE pt.provider_id = p.id AND pt.tag = ANY($tags)
  ))
GROUP BY p.id, pl.id
HAVING COUNT(DISTINCT avs.id) > 0  -- Must have at least 1 available slot
```

### Step 3: Scoring Algorithm

```typescript
interface ScoredResult {
  provider: Provider;
  scores: {
    relevance: number;    // 0-50
    quality: number;      // 0-30
    adBoost: number;      // 0-20
    total: number;        // 0-100
  };
  isSponsored: boolean;
}
```

**Relevance Score (0-50)**:

| Factor | Max Points | Logic |
|--------|-----------|-------|
| Cuisine match | 15 | Exact match = 15, partial overlap = 10 |
| Location distance | 15 | < 1km = 15, linear decay to 0 at maxDistance |
| Time match | 10 | Slot starts within 30min of requested time = 10, within 60min = 5 |
| Party size fit | 5 | Exact within range = 5, near boundary = 3 |
| Available slots count | 5 | More slots = higher score (indicates flexibility) |

**Quality Score (0-30)**:

| Factor | Max Points | Logic |
|--------|-----------|-------|
| Profile completeness | 8 | `provider.profileComplete * 8` |
| Conversion rate | 8 | Bookings / clicks ratio from analytics |
| Data freshness | 7 | Last webhook update recency |
| Rating | 7 | `(provider.rating / 5) * 7` |

**Ad Boost Score (0-20)**:

| Factor | Max Points | Logic |
|--------|-----------|-------|
| Has active campaign | Required | Campaign must be active + within budget |
| Bid amount | 12 | Normalized: `(bid / maxBid) * 12` |
| Targeting match | 5 | City match + cuisine match + time match |
| Budget remaining | 3 | Higher remaining daily budget = higher score |

Implementation in `ranking.service.ts`:

```typescript
function calculateTotalScore(
  provider: ProviderWithRelations,
  filters: SearchFilters,
  campaign: Campaign | null,
  maxBidInResults: number
): ScoredResult {
  const relevance = calculateRelevance(provider, filters);
  const quality = calculateQuality(provider);
  const adBoost = campaign
    ? calculateAdBoost(campaign, filters, maxBidInResults)
    : 0;

  return {
    provider,
    scores: {
      relevance,
      quality,
      adBoost,
      total: relevance + quality + adBoost,
    },
    isSponsored: adBoost > 0,
  };
}
```

### Step 4: Response

Sort by total score descending. Mark sponsored results. Return top N.

```typescript
interface SearchResponse {
  results: Array<{
    id: string;
    name: string;
    cuisineType: string[];
    description: string;
    location: { city: string; distance_km: number };
    rating: number;
    priceRange: number;
    tags: string[];
    availableSlots: Array<{ time: string; bookingTypeId: string }>;
    images: string[];  // First 3 image URLs
    isSponsored: boolean;
  }>;
  totalResults: number;
  page: number;
  pageSize: number;
}
```

### Performance Targets

- **P50 latency**: <50ms
- **P95 latency**: <200ms
- **Strategy**: PostgreSQL GIN indexes on array columns, composite indexes on availability slots, connection pooling (PgBouncer or Prisma connection pool), query result caching in Redis (30-second TTL for search results, invalidated on webhook).

---

## 6. Webhook Processing Architecture

### Design Principles

1. **Receive fast, process async**: Webhook endpoint returns 200 immediately after validation + queue.
2. **Idempotency**: Every webhook event has a unique ID. Process at-most-once using `WebhookLog`.
3. **Ordering**: Process webhooks per-integration sequentially (BullMQ concurrency=1 per integration).
4. **Retry with backoff**: Failed processing retries 3x with exponential backoff.

### Flow

```
Source Platform (Jimani/Zenchef)
    │
    ▼
[POST /v1/webhooks/*]
    │
    ├── 1. Verify HMAC signature (webhookAuth middleware)
    ├── 2. Validate payload schema (Zod)
    ├── 3. Check idempotency (WebhookLog lookup)
    ├── 4. Insert WebhookLog (status=received)
    ├── 5. Enqueue to BullMQ (queue=webhooks, jobId=eventId)
    ├── 6. Return 200 OK immediately
    │
    ▼
[BullMQ Worker: webhook.worker.ts]
    │
    ├── 7. Update WebhookLog (status=processing)
    ├── 8. Route to handler by eventType:
    │   ├── provider-updated    → upsert Provider + ProviderLocation
    │   ├── booking-types-updated → upsert BookingTypes
    │   ├── availability-updated → upsert AvailabilitySlots
    │   ├── booking-updated     → update Booking status
    │   └── booking-email-updated → update Provider email settings
    ├── 9. Update WebhookLog (status=processed)
    │
    └── On failure:
        ├── Retry 3x with backoff (1min, 5min, 15min)
        └── Update WebhookLog (status=failed, errorMessage=...)
```

### BullMQ Queue Configuration

```typescript
// queue.ts
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL);

export const webhookQueue = new Queue('webhooks', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 60_000 },
    removeOnComplete: { age: 7 * 24 * 3600 }, // Keep 7 days
    removeOnFail: { age: 30 * 24 * 3600 },    // Keep 30 days
  },
});

// Worker processes 5 jobs concurrently (but 1 per integration via job grouping)
export const webhookWorker = new Worker('webhooks', processWebhook, {
  connection,
  concurrency: 5,
  limiter: { max: 100, duration: 1000 }, // Max 100 jobs/sec
});
```

### Jimani ↔ AiBooker Endpoint Matrix (from Miro)

The integration between Jimani and AiBooker is organized into **3 layers**:

#### Layer 1: Onboarding & Sync (Jimani → AiBooker)

| Endpoint | Method | Direction | Description | Phase 1 |
|----------|--------|-----------|-------------|---------|
| `/v1/integrations/activate` | POST | Jimani → AiBooker | Jimani activates integration, sends secure token + restaurant external ID. AiBooker creates Integration + Provider. | Mandatory |
| `/v1/integrations/validate` | POST | Jimani → AiBooker | Heartbeat/status check to verify integration is still active. | Mandatory |
| `/v1/webhooks/provider-updated` | POST | Jimani → AiBooker | Push restaurant profile data (name, contact, location, cuisine, tags). Frequency: on change or hourly. | Mandatory |
| `/v1/webhooks/booking-types-updated` | POST | Jimani → AiBooker | Push booking types (lunch, dinner, private dining) with party size ranges, duration, settings. | Mandatory |
| `/v1/webhooks/availability-updated` | POST | Jimani → AiBooker | Push availability slots (date, timeslots, capacity, max party size). Frequency: every 5 minutes or on change. | Mandatory |

#### Layer 2: Transaction Flow (AiBooker → Jimani)

| Endpoint (on Jimani) | Method | Direction | Description | Phase 1 |
|----------------------|--------|-----------|-------------|---------|
| `POST /v1/aibooker/availability/check` | POST | AiBooker → Jimani | Real-time availability check for a specific restaurant, date, time, party size. Returns available=true/false + alternative time slots. | Mandatory |
| `POST /v1/aibooker/bookings` | POST | AiBooker → Jimani | Create booking with customer details (name, email, phone, language), party size, date/time, special requests, and source attribution (campaign_type, click_id, lead_id). Jimani handles payment + email confirmation. | Mandatory |
| `GET /v1/aibooker/bookings/{id}` | GET | AiBooker → Jimani | Retrieve booking details by external booking ID. | Optional (Phase 2) |
| `DELETE /v1/aibooker/bookings/{id}` | DELETE | AiBooker → Jimani | Cancel an existing booking. | Optional (Phase 2) |

#### Layer 3: Feedback Loop (Jimani → AiBooker)

| Endpoint | Method | Direction | Description | Phase 1 |
|----------|--------|-----------|-------------|---------|
| `/v1/webhooks/booking-updated` | POST | Jimani → AiBooker | Booking status changed (confirmed, cancelled, no_show, completed). Includes external booking ID mapping. | Mandatory |
| `/v1/webhooks/booking-email-updated` | POST | Jimani → AiBooker | Email confirmation sent/delivered/failed status. For tracking/analytics only (partner handles sending). | Optional (Phase 2) |

#### Update Frequencies (from Miro)

| Data Type | Push Frequency | Notes |
|-----------|---------------|-------|
| Restaurant profile | On change or hourly | Name, contact, location, cuisine |
| Booking types | On change | Lunch, dinner, private dining config |
| Availability slots | Every 5 minutes or on change | Timeslots, capacity, party sizes |
| Booking status | Real-time (on change) | Confirmed, cancelled, etc. |

---

### Webhook Payload Mapping

Each connector package exports a mapper that translates source-specific payloads to AiBooker's internal models:

```typescript
// packages/connectors/src/jimani/mapper.ts
export function mapProviderUpdate(payload: JimaniProviderPayload): ProviderUpsertInput {
  return {
    name: payload.restaurant_name,
    cuisineType: payload.cuisine_tags,
    phone: payload.contact?.phone,
    email: payload.contact?.email,
    location: {
      streetAddress: payload.address.street,
      city: payload.address.city.toLowerCase(),
      postalCode: payload.address.postal_code,
      country: 'NL',
      latitude: payload.address.lat,
      longitude: payload.address.lng,
    },
  };
}
```

### Availability Polling (supplement to webhooks)

Per the Miro integration spec, availability data is also polled every **5 minutes** per active integration to supplement webhook-driven updates. This ensures freshness even if a webhook is missed or delayed:
- `availabilityPoll.ts` scheduler iterates active integrations and calls the source connector's availability endpoint
- Results are merged with existing slots (upsert by `bookingTypeId + date + startTime`)
- Polling is staggered across integrations to avoid thundering herd

### Booking Hold Expiry

A scheduler runs every **30 seconds** to release expired booking holds:
- Query: `SELECT * FROM bookings WHERE status = 'held' AND hold_expires_at < NOW()`
- For each expired hold: set `status = 'cancelled'`, restore availability slot capacity
- This enforces the **300-second (5 min) hold TTL** defined in the Miro spec

### Stale Data Cleanup

Scheduled job runs every hour:
- Delete `AvailabilitySlot` records where `expiresAt < NOW()`
- Flag providers whose last webhook was >48 hours ago for review

---

## 7. Booking Flow (Payment + Email Handled by Partner)

### Design Principle

AiBooker does **not** handle payments or email confirmations. These are the responsibility of the **partner system** (Jimani, Zenchef, etc.). AiBooker acts as a middleware: it creates the booking in the partner system, and the partner handles deposit collection (via Mollie or their own gateway) and guest email confirmations.

### Booking Flow

```
User confirms booking via AI
    │
    ▼
[POST /v1/ai/book]
    │
    ├── 1. Validate booking details
    ├── 2. Check availability (live check with partner connector)
    ├── 3. Place booking hold (status=held, holdExpiresAt=now+300s)
    │       The hold reserves the slot for 5 minutes while the partner processes.
    ├── 4. Create CustomerLead (if new)
    ├── 5. Create Booking in AiBooker DB (status=pending)
    ├── 6. Call partner connector: POST booking to partner system
    │       Partner system handles:
    │       - Deposit/payment collection (if required)
    │       - Email confirmation to guest
    ├── 7. Store externalBookingId from partner response
    ├── 8. Return booking confirmation to AI platform
    │
    ▼
Partner system processes booking
    │
    ▼
[POST /v1/webhooks/booking-updated] (partner callback)
    │
    ├── 9. Update Booking status based on partner status
    │
    ├── IF partner confirms:
    │   ├── 10. Update Booking status = "confirmed"
    │   ├── 11. Deduct campaign spend (if campaign-driven)
    │   └── 12. Update AnalyticsDaily
    │
    ├── IF partner cancels/rejects:
    │   ├── 13. Update Booking status = "cancelled"
    │   └── 14. Release booking hold and restore availability slot capacity
    │
    └── IF hold expires (300s TTL, handled by holdExpiry scheduler):
        ├── 15. Update Booking status = "cancelled"
        └── 16. Restore availability slot capacity
```

### Email Confirmation

Email confirmations are handled by the **partner system**. The `booking-email-updated` webhook notifies AiBooker of email delivery status for tracking/analytics purposes. AiBooker never sends emails to guests.

### Payment / Deposits

Deposit collection is handled by the **partner system** (via their own Mollie integration or other gateway). AiBooker tracks whether a booking type requires a deposit (synced via webhooks) for display purposes in search results, but does not process payments.

---

## 8. AI Tool Integration

### OpenAI Function Calling Schema

These are the tool definitions that get registered with ChatGPT Actions / OpenAI function calling:

```json
{
  "functions": [
    {
      "name": "search_restaurants",
      "description": "Search for restaurants available for booking. Returns a ranked list of restaurants matching the criteria with availability information.",
      "parameters": {
        "type": "object",
        "properties": {
          "city": {
            "type": "string",
            "description": "City name in the Netherlands (e.g., 'amsterdam', 'rotterdam')"
          },
          "cuisine": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Cuisine types (e.g., ['italian', 'japanese']). Omit for all cuisines."
          },
          "date": {
            "type": "string",
            "format": "date",
            "description": "Desired date in YYYY-MM-DD format"
          },
          "time": {
            "type": "string",
            "description": "Desired time in HH:mm format (e.g., '19:30')"
          },
          "party_size": {
            "type": "integer",
            "minimum": 1,
            "maximum": 50,
            "description": "Number of guests"
          },
          "tags": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Optional tags: 'romantic', 'terrace', 'kid-friendly', 'wheelchair-accessible', 'private-dining'"
          },
          "latitude": {
            "type": "number",
            "description": "User's latitude for distance-based ranking (optional)"
          },
          "longitude": {
            "type": "number",
            "description": "User's longitude for distance-based ranking (optional)"
          }
        },
        "required": ["date", "time", "party_size"]
      }
    },
    {
      "name": "check_availability",
      "description": "Check real-time availability for a specific restaurant, date, time, and party size. Returns alternative time slots when the requested time is unavailable. Call this after the user selects a restaurant from search results.",
      "parameters": {
        "type": "object",
        "properties": {
          "provider_id": {
            "type": "string",
            "description": "Restaurant ID from search results"
          },
          "booking_type_id": {
            "type": "string",
            "description": "Booking type ID from search results (e.g., lunch, dinner)"
          },
          "date": {
            "type": "string",
            "format": "date",
            "description": "Date in YYYY-MM-DD format"
          },
          "time": {
            "type": "string",
            "description": "Time in HH:mm format"
          },
          "party_size": {
            "type": "integer",
            "description": "Number of guests"
          }
        },
        "required": ["provider_id", "booking_type_id", "date", "time", "party_size"]
      }
    },
    {
      "name": "create_booking",
      "description": "Create a restaurant booking. The booking is forwarded to the restaurant's partner system which handles payment and email confirmation.",
      "parameters": {
        "type": "object",
        "properties": {
          "provider_id": { "type": "string" },
          "booking_type_id": { "type": "string" },
          "date": { "type": "string", "format": "date" },
          "time": { "type": "string" },
          "party_size": { "type": "integer" },
          "guest_first_name": { "type": "string" },
          "guest_last_name": { "type": "string" },
          "guest_email": { "type": "string", "format": "email" },
          "guest_phone": {
            "type": "string",
            "description": "Phone number with country code (e.g., '+31612345678')"
          },
          "special_requests": {
            "type": "string",
            "description": "Any special requests, allergies, or notes"
          },
          "click_id": {
            "type": "string",
            "description": "Click tracking ID from the search result that led to this booking (for attribution)"
          },
          "lead_id": {
            "type": "string",
            "description": "Lead ID from the originating search/interaction session (for attribution)"
          }
        },
        "required": ["provider_id", "booking_type_id", "date", "time", "party_size", "guest_first_name", "guest_last_name", "guest_email", "guest_phone"]
      }
    },
    {
      "name": "get_booking_status",
      "description": "Get the current status of a booking by its ID.",
      "parameters": {
        "type": "object",
        "properties": {
          "booking_id": {
            "type": "string",
            "description": "The AiBooker booking ID returned from create_booking"
          }
        },
        "required": ["booking_id"]
      }
    }
  ]
}
```

### Gemini Function Declaration

Gemini uses essentially the same schema but wrapped differently:

```typescript
const geminiTools = [{
  functionDeclarations: [
    {
      name: "search_restaurants",
      description: "...", // Same as above
      parameters: {
        type: "OBJECT",
        properties: { /* same structure, Gemini uses uppercase types */ },
        required: ["date", "time", "party_size"]
      }
    },
    // ... same for other functions
  ]
}];
```

### AI Tool Response Design

Responses are optimized for AI consumption -- concise, structured, with natural-language-friendly fields:

```typescript
// search_restaurants response
{
  "results": [
    {
      "id": "clx...",
      "name": "Ristorante Da Mario",
      "cuisine": ["Italian", "Mediterranean"],
      "description": "Authentic Italian cuisine in the heart of Amsterdam's Jordaan neighborhood.",
      "city": "Amsterdam",
      "distance_km": 1.2,
      "rating": 4.6,
      "price_range": "€€€",
      "tags": ["romantic", "terrace"],
      "available_times": ["19:00", "19:30", "20:00"],
      "booking_type": { "id": "clx...", "name": "Dinner" },
      "image_url": "https://cdn.aibooker.nl/...",
      "sponsored": false
    }
  ],
  "total_results": 12,
  "message": "Found 12 Italian restaurants in Amsterdam with availability for 4 guests on March 25."
}

// check_availability response
{
  "available": true,
  "provider_name": "Ristorante Da Mario",
  "date": "2026-03-25",
  "time": "19:30",
  "party_size": 4,
  "booking_type": "Dinner",
  "alternative_times": ["19:00", "20:00", "20:30"],
  "message": "Table available for 4 at 19:30 on March 25."
}
// When requested time is unavailable, alternative_times provides nearby options:
// {
//   "available": false,
//   "provider_name": "Ristorante Da Mario",
//   "date": "2026-03-25",
//   "time": "19:30",
//   "party_size": 4,
//   "alternative_times": ["19:00", "20:00", "20:30"],
//   "message": "No table at 19:30, but slots at 19:00, 20:00, and 20:30 are available."
// }

// create_booking response (booking forwarded to partner for payment/email)
{
  "booking_id": "clx...",
  "status": "pending",
  "hold_expires_at": "2026-03-25T18:35:00Z",
  "confirmation": {
    "restaurant": "Ristorante Da Mario",
    "date": "March 25, 2026",
    "time": "19:30",
    "party_size": 4,
    "address": "Westerstraat 42, Amsterdam"
  },
  "message": "Your booking has been submitted to Ristorante Da Mario. They will handle payment and send you a confirmation email at john@example.com."
}
// Once partner confirms (via webhook), status becomes "confirmed"
```

### OpenAI Actions Configuration (for ChatGPT)

AiBooker publishes an OpenAPI 3.1 spec that ChatGPT Actions consumes:

```yaml
# docs/api/ai-tool-api.yaml
openapi: "3.1.0"
info:
  title: "AiBooker Restaurant Booking"
  description: "Search and book restaurants in the Netherlands"
  version: "1.0.0"
servers:
  - url: "https://api.aibooker.nl/v1/ai"
paths:
  /search:
    post:
      operationId: search_restaurants
      summary: Search restaurants with availability
      # ... request/response schemas
  /availability:
    post:
      operationId: check_availability
      # ...
  /book:
    post:
      operationId: create_booking
      # ...
  /booking-status:
    post:
      operationId: get_booking_status
      # ...
```

---

## 9. Partner Dashboard Pages/Components

### Page Map

```
/login                          → Email/password login
/onboarding                     → 3-step stepper (redirected from Jimani activation)
  Step 1: Verify business info (pre-filled from webhook)
  Step 2: Configure booking types + upload media
  Step 3: Review + Go Live

/overview                       → Analytics dashboard (default after login)
/profile                        → Business profile editor
  Tab "Business Info"           → Name, description, cuisine, price range, contact
  Tab "Location"                → Address, map pin
  Tab "Tags"                    → Select tags from predefined list
/profile/booking-types          → List of booking types from source platform
  Click → Edit modal            → Description, party size range, deposit settings, media
/media                          → Media library (grid view, drag-to-reorder)
/bookings                       → Paginated table with filters (date, status)
  Click → Booking detail        → Full details, status timeline, customer info
/campaigns                      → Campaign list with status badges
  /campaigns/new                → Create campaign form
  Click → Edit campaign         → Same form, pre-filled
/analytics                      → Detailed charts (impressions, clicks, bookings, revenue, ad spend)
  Date range picker, breakdown by booking type
/settings                       → Integration status, partner connection, change password
```

### Key Components

**OnboardingStepper.tsx**: Multi-step form using React Hook Form + Zod. Each step saves progress to API. Step 3 sets provider status to "active".

**Data Editability Rules** (per Miro integration spec):
- Restaurant details (name, description, cuisine, contact, tags): **Editable** by provider in dashboard
- Location/address: **Editable** by provider in dashboard
- Booking types: **Read-only** from partner system (synced via webhooks). Only description, deposit settings, and media are editable in AiBooker.
- Availability slots: **Read-only** from partner system (synced via webhooks + 5-min polling). Not editable in dashboard.
- Booking status: **Read-only** — managed by partner system and payment flow

**Authentication Flow** (per Miro spec):
- Supports both direct email/password sign-in AND magic link continuation from partner system (e.g., Jimani redirects user with a one-time token → AiBooker validates token → creates session → drops user into onboarding or dashboard)
- Magic link tokens expire after 15 minutes and are single-use

**ProfileForm.tsx**: 
- Fields: name, description (rich text / markdown), cuisineType (multi-select from predefined list), priceRange (1-4 radio), phone, email, website
- Auto-save on blur or debounced (1s)
- Profile completeness indicator (progress bar)

**BookingTypeForm.tsx** (modal):
- Fields: description (textarea), minPartySize, maxPartySize
- MediaUploader sub-component for per-booking-type images

**MediaUploader.tsx**:
- Drag-and-drop zone (react-dropzone)
- Flow: (1) request presigned URL from API, (2) upload directly to S3/R2 from browser, (3) register uploaded URL with API
- Image preview, crop (optional), alt text field
- Max 10MB per image, 5MB for PDFs

**CampaignForm.tsx**:
- Fields: name, type (CPC/CPA select), bidAmount (EUR input), dailyBudget (EUR input), totalBudget (optional), targetCities (multi-select), targetCuisines (multi-select), targetTags (multi-select), targetTimeSlots (multi-select), startDate, endDate (optional)
- Live preview of estimated impressions (based on current search volume for similar filters)
- Budget validation (minimum bid: EUR 0.10, minimum daily budget: EUR 5.00)

**BookingsTable.tsx**:
- Columns: Date, Time, Guest name, Party size, Status (badge), Source (AI platform icon), Revenue
- Filters: date range, status dropdown
- Cursor-based pagination
- Click row to expand detail

**BookingChart.tsx / RevenueChart.tsx**:
- Recharts or Chart.js
- Line charts: bookings over time, revenue over time
- Bar charts: bookings by day of week, by booking type
- Metrics cards: total bookings this month, conversion rate, avg party size, total revenue

### Dashboard State Management

- **Server state**: TanStack Query (React Query) for all API calls. Mutations with optimistic updates.
- **Form state**: React Hook Form + Zod resolver.
- **No global client state store needed** for MVP -- React Query cache is sufficient.

### UI Framework

- **shadcn/ui**: Pre-built Tailwind components (Button, Input, Table, Dialog, Select, Badge, Card, Tabs, Tooltip)
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icons

---

## 10. Testing Strategy

### Test Pyramid

```
          ┌─────────────┐
          │   E2E (5%)   │  Playwright: critical booking flow
          ├─────────────┤
          │ Integration  │  Supertest + test DB: API routes,
          │   (25%)      │  webhook processing, payment flow
          ├─────────────┤
          │  Unit (70%)  │  Vitest: services, ranking, mappers,
          │              │  utils, validators
          └─────────────┘
```

### Unit Tests (Vitest)

**Location**: Co-located `*.test.ts` files next to source.

**Key test files**:
- `ranking.service.test.ts` -- Verify score calculations with known inputs/outputs. Test edge cases: no campaigns, all scores zero, tie-breaking.
- `search.service.test.ts` -- Mock Prisma, verify filter translation to correct query params.
- `webhook.service.test.ts` -- Mock DB, verify idempotency (same event ID processed only once), verify payload mapping.
- `booking.service.test.ts` -- Verify hold creation, partner handoff, hold expiry, status transitions.
- `geo.test.ts` -- Known lat/lng pairs with expected distances.
- `hmac.test.ts` -- Known payloads with expected signatures.
- `packages/connectors/src/jimani/mapper.test.ts` -- Snapshot tests for payload mapping.

### Integration Tests (Supertest + PostgreSQL test container)

**Location**: `apps/api/src/__tests__/integration/`

Use `testcontainers` to spin up a real PostgreSQL + Redis for integration tests. Each test file gets a clean DB via Prisma migrations + truncate.

**Key test scenarios**:
1. **Integration activation flow**: POST activate -> verify Integration + Provider created
2. **Webhook processing flow**: POST webhook with valid HMAC -> verify DB updated
3. **Search flow**: Seed providers + availability -> POST search -> verify ranked results
4. **Booking flow**: Seed data -> search -> availability check -> create booking -> hold -> partner confirm via webhook -> verify states
5. **Hold expiry flow**: Create booking with hold -> let hold expire -> verify booking cancelled + slot restored
6. **Idempotency**: Send same webhook twice -> verify single processing
7. **Auth rejection**: Invalid HMAC -> 401. Invalid bearer -> 401. Expired JWT -> 401.

### E2E Tests (Playwright)

**Location**: `apps/dashboard/e2e/`

**Key scenarios**:
1. Login -> see overview dashboard
2. Complete onboarding stepper (3 steps)
3. Edit profile -> verify saved
4. Create campaign -> verify appears in list
5. View bookings table -> filter by date

### Load Tests (k6)

**Location**: `docs/load-tests/`

```javascript
// search-load-test.js
import http from 'k6/http';
export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp up
    { duration: '2m', target: 200 },    // Sustained load
    { duration: '30s', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],   // 95% of requests under 200ms
    http_req_failed: ['rate<0.01'],     // Less than 1% failure rate
  },
};
```

### CI Pipeline

```yaml
# .github/workflows/ci.yml
jobs:
  lint-typecheck:
    - pnpm lint
    - pnpm typecheck

  unit-tests:
    - pnpm test:unit --coverage
    - Upload coverage to Codecov (target: 80%)

  integration-tests:
    services:
      postgres: postgres:16
      redis: redis:7
    - pnpm test:integration

  build:
    - pnpm build (both apps + packages)

  e2e-tests: (on merge to main only)
    - pnpm test:e2e
```

---

## 11. Deployment / Infrastructure

### MVP Architecture (Railway or VPS)

```
┌─────────────────────────────────────────────────────┐
│  Cloudflare (DNS + CDN + DDoS protection)           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐    ┌──────────────────────────┐  │
│  │  Dashboard    │    │  API Server              │  │
│  │  (Next.js)    │    │  (Fastify + BullMQ)      │  │
│  │  Port 3000    │    │  Port 4000               │  │
│  └──────────────┘    └──────────────────────────┘  │
│                                                     │
│  ┌──────────────┐    ┌──────────────────────────┐  │
│  │  PostgreSQL   │    │  Redis                   │  │
│  │  (managed)    │    │  (managed or local)      │  │
│  └──────────────┘    └──────────────────────────┘  │
│                                                     │
│  ┌──────────────┐                                  │
│  │  R2 / S3     │  (media storage)                 │
│  └──────────────┘                                  │
└─────────────────────────────────────────────────────┘
```

### Railway Setup (recommended for MVP)

- **API service**: Docker container from `apps/api/Dockerfile`
- **Dashboard service**: Docker container from `apps/dashboard/Dockerfile`
- **PostgreSQL**: Railway managed PostgreSQL
- **Redis**: Railway managed Redis
- **Environment variables**: Managed via Railway dashboard

### Docker Configuration

```dockerfile
# apps/api/Dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @aibooker/database generate
RUN pnpm --filter @aibooker/api build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/packages/database/prisma ./prisma
EXPOSE 4000
CMD ["node", "dist/index.js"]
```

### Domain Setup

- `api.aibooker.nl` -> API server
- `dashboard.aibooker.nl` -> Next.js dashboard
- `cdn.aibooker.nl` -> R2/S3 media (via Cloudflare CDN)

### Monitoring and Observability

| Concern | Tool | Details |
|---------|------|---------|
| Structured logging | Pino | JSON logs, request ID in every log line |
| Error tracking | Sentry | Source maps for dashboard, stack traces for API |
| Uptime monitoring | UptimeRobot (free) or Checkly | Ping /health every 60s |
| Metrics | Built-in Fastify metrics + Prometheus (later) | Request count, latency, queue depth |
| Alerting | Sentry alerts + email | On: 5xx spike, queue depth >100, payment failures |

### Backup Strategy

- PostgreSQL: Daily automated backups (Railway provides this)
- Media (R2/S3): Versioning enabled, lifecycle policy for old versions

### Scaling Path (post-MVP)

1. **Horizontal API scaling**: Add more API containers behind load balancer
2. **Read replicas**: PostgreSQL read replica for search queries
3. **Dedicated worker**: Separate container for BullMQ workers (decouple from API)
4. **CDN caching**: Cache search results at edge (30s TTL, vary by query params)
5. **Elasticsearch**: When provider count exceeds ~10K, move search to dedicated search engine

---

## 12. Security Considerations

### Authentication and Authorization

| Layer | Mechanism | Details |
|-------|-----------|--------|
| Webhook endpoints | HMAC-SHA256 | Per-integration secret, timing-safe comparison |
| AI tool endpoints | Bearer API key | One key per AI platform, stored in env vars |
| Dashboard API | JWT (RS256) | 15min access token, 7d refresh token, httpOnly cookie |
| Dashboard pages | Next.js middleware | Check JWT on every request, redirect to /login if expired |

### Data Protection

1. **Encryption at rest**: `Integration.credentials` encrypted with AES-256-GCM before storage. Encryption key from env var `ENCRYPTION_KEY`, rotatable.
2. **PII handling**: CustomerLead data (email, phone, name) is needed for booking but should be treated as sensitive. Implement data retention policy: delete leads with no bookings after 90 days.
3. **GDPR compliance** (NL/EU):
   - Right to deletion: API endpoint to delete customer lead + anonymize booking records
   - Data processing agreement template for partner restaurants
   - Privacy policy published at `aibooker.nl/privacy`
4. **No plaintext secrets in logs**: Pino redaction paths configured for `password`, `apiKey`, `webhookSecret`, `credentials`, `authorization`.

### Input Validation

- **All inputs validated with Zod schemas** at the route level before reaching controllers.
- **SQL injection**: Prisma parameterized queries (never raw SQL with string interpolation).
- **XSS**: Next.js auto-escapes by default. Dashboard API returns JSON only (no HTML rendering server-side).
- **Request size limits**: Fastify `bodyLimit: 1MB` for webhooks, `10MB` for media metadata.

### API Security Headers

```typescript
// Via @fastify/helmet
{
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  dnsPrefetchControl: true,
  frameguard: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: true,
  xssFilter: true,
}
```

### Rate Limiting (DDoS mitigation)

- Cloudflare provides L3/L4 DDoS protection
- Application-level rate limiting (see section 4) via Redis-backed sliding window
- Webhook endpoints: Additional protection via HMAC (invalid signatures rejected before any processing)

### Dependency Security

- `pnpm audit` in CI pipeline -- fail build on high/critical vulnerabilities
- Dependabot or Renovate for automated dependency updates
- Lock file (`pnpm-lock.yaml`) committed and enforced with `--frozen-lockfile`

### Secrets Management

For MVP (Railway): Railway's built-in environment variables (encrypted at rest).

Required environment variables:

```env
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# Encryption
ENCRYPTION_KEY=base64-encoded-32-byte-key

# JWT
JWT_SECRET=random-256-bit-secret
JWT_REFRESH_SECRET=different-random-256-bit-secret

# AI Platform API Keys (that AiBooker issues to platforms)
OPENAI_AIBOOKER_KEY=ak_openai_...
GEMINI_AIBOOKER_KEY=ak_gemini_...

# Jimani
JIMANI_BASE_URL=https://api.jimani.nl
JIMANI_API_KEY=...

# Zenchef
ZENCHEF_BASE_URL=https://api.zenchef.com
ZENCHEF_API_KEY=...

# Media Storage
S3_ENDPOINT=https://...r2.cloudflarestorage.com
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_BUCKET=aibooker-media

# App
NODE_ENV=production
API_PORT=4000
DASHBOARD_URL=https://dashboard.aibooker.nl
API_URL=https://api.aibooker.nl
```

---

## Summary: Developer Task Allocation

### Developer A (Backend/Infrastructure Focus)
- Monorepo + CI setup
- Fastify app skeleton + middleware
- Webhook processing + BullMQ
- Search + ranking engine
- Booking hold mechanism + partner handoff
- Deployment setup
- Load testing

### Developer B (Fullstack/Integration Focus)
- Prisma schema + database
- Connector packages (Jimani, Zenchef)
- Dashboard frontend (Next.js)
- AI tool API endpoints + OpenAI/Gemini schemas
- Onboarding flow
- E2E tests

Both developers pair on integration tests and code review all PRs.

---

### Critical Files for Implementation
- `C:/Users/PC/Desktop/AiBooker/packages/database/prisma/schema.prisma` - The entire data model; every service depends on this being correct first
- `C:/Users/PC/Desktop/AiBooker/apps/api/src/services/search.service.ts` - Core search and ranking engine, the primary value proposition of AiBooker
- `C:/Users/PC/Desktop/AiBooker/apps/api/src/services/booking.service.ts` - Orchestrates the critical booking flow: availability check, hold, partner handoff, status management
- `C:/Users/PC/Desktop/AiBooker/apps/api/src/routes/v1/ai-tools.ts` - The AI-facing API surface; defines how ChatGPT/Gemini interact with AiBooker
- `C:/Users/PC/Desktop/AiBooker/packages/connectors/src/jimani/client.ts` - First connector implementation; establishes the pattern all future connectors follow
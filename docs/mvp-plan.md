# AiBooker -- MVP Plan (3 Weeks)

## What is the MVP?

AiBooker MVP is the **minimum slice** that proves the core value proposition: **AI platforms (ChatGPT, Gemini) can search and book restaurants through Jimani** — end-to-end, in production.

---

## MVP Scope: In vs. Out

### IN (MVP)

| Feature | Details |
|---------|---------|
| Jimani integration (Layer 1) | Activation, validation, all 5 webhooks |
| Jimani transaction flow (Layer 2) | Availability check + booking creation |
| Jimani feedback loop (Layer 3) | Booking status webhook (mandatory only) |
| Search endpoint | Filter by city, cuisine, date, time, party size, tags |
| Basic ranking | Relevance scoring only (no campaigns, no ad boost) |
| Availability check | Local slot check + live Jimani check + alternative time slots |
| Booking creation | 300s hold + partner handoff + status tracking |
| Booking status | Get booking status by ID |
| AI function specs | OpenAI Actions schema + Gemini function declarations |
| Basic dashboard | Login (magic link from Jimani) + onboarding stepper + profile view (read-only) |
| Deployment | Single environment (Railway or VPS), Cloudflare DNS |

### OUT (Post-MVP — Full Plan)

| Feature | Deferred To |
|---------|-------------|
| Campaign / ad system (CPC/CPA) | Full plan Phase 2+ |
| Ad boost in ranking | Full plan Phase 2+ |
| Quality score in ranking | Full plan Phase 2+ |
| Media upload (S3/R2) | Full plan Phase 3 |
| Campaign management UI | Full plan Phase 3 |
| Analytics dashboard + charts | Full plan Phase 3 |
| Zenchef connector | Full plan Phase 4 |
| Booking cancellation (`DELETE`) | Full plan Phase 4 |
| Booking retrieval (`GET /bookings/{id}`) | Full plan Phase 4 |
| Email status webhook | Full plan Phase 4 |
| Load testing (k6) | Full plan Phase 4 |
| E2E tests (Playwright) | Full plan Phase 4 |
| Profile editing in dashboard | Full plan Phase 3 |
| Availability polling (5-min) | Full plan Phase 2 |

---

## MVP Architecture

```
AI Platforms (ChatGPT, Gemini)
    │
    ▼
┌─────────────────────────────┐
│  AiBooker API (Fastify)     │
│  - /v1/ai/* (search, book)  │
│  - /v1/webhooks/* (Jimani)  │
│  - /v1/integrations/*       │
│  - /v1/dashboard/* (basic)  │
│  - BullMQ (webhook queue)   │
└──────────┬──────────────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
┌─────────┐ ┌─────────┐
│ Postgres│ │  Redis  │
│ (managed)│ │(managed)│
└─────────┘ └─────────┘
           │
           ▼
┌─────────────────────────────┐
│  Jimani API                 │
│  - availability/check       │
│  - bookings (create)        │
└─────────────────────────────┘

Dashboard (Next.js) — minimal: login + onboarding + read-only profile
```

---

## MVP Database Schema (Simplified)

Only the models needed for MVP. Removed: Campaign, AnalyticsDaily, ProviderMedia, ProviderTag (tags stored as array on Provider).

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Integration {
  id              String   @id @default(cuid())
  source          String   // "jimani"
  externalId      String   // Restaurant ID on Jimani
  status          String   @default("pending") // pending | active | suspended
  apiKey          String   @unique @default(cuid())
  webhookSecret   String
  credentials     Json?    // Encrypted Jimani API credentials
  activatedAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  provider        Provider?

  @@unique([source, externalId])
  @@map("integrations")
}

model Provider {
  id                String   @id @default(cuid())
  integrationId     String   @unique
  integration       Integration @relation(fields: [integrationId], references: [id])

  name              String
  slug              String   @unique
  description       String?  @db.Text
  cuisineType       String[] // ["italian", "pizza"]
  tags              String[] // ["romantic", "terrace"] — simplified, no separate table
  phone             String?
  email             String?
  website           String?
  priceRange        Int?     // 1-4
  rating            Float?

  status            String   @default("onboarding") // onboarding | active | paused

  // Dashboard auth
  dashboardEmail    String?  @unique
  dashboardPasswordHash String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  location          ProviderLocation?
  bookingTypes      BookingType[]
  bookings          Booking[]

  @@index([status])
  @@index([cuisineType], type: Gin)
  @@map("providers")
}

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

model BookingType {
  id              String   @id @default(cuid())
  providerId      String
  provider        Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  externalId      String
  name            String   // "Lunch", "Diner"
  description     String?  @db.Text
  minPartySize    Int      @default(1)
  maxPartySize    Int      @default(20)
  duration        Int      @default(120)
  isActive        Boolean  @default(true)
  settings        Json?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  availabilitySlots AvailabilitySlot[]
  bookings          Booking[]

  @@unique([providerId, externalId])
  @@index([providerId, isActive])
  @@map("booking_types")
}

model AvailabilitySlot {
  id              String   @id @default(cuid())
  bookingTypeId   String
  bookingType     BookingType @relation(fields: [bookingTypeId], references: [id], onDelete: Cascade)

  date            DateTime @db.Date
  startTime       String   // "18:00"
  endTime         String   // "20:00"
  capacity        Int
  maxPartySize    Int?

  externalId      String?
  lastSyncedAt    DateTime @default(now())
  expiresAt       DateTime

  @@unique([bookingTypeId, date, startTime])
  @@index([date, startTime])
  @@index([expiresAt])
  @@map("availability_slots")
}

model Booking {
  id              String   @id @default(cuid())
  providerId      String
  provider        Provider @relation(fields: [providerId], references: [id])
  bookingTypeId   String
  bookingType     BookingType @relation(fields: [bookingTypeId], references: [id])
  customerLeadId  String
  customerLead    CustomerLead @relation(fields: [customerLeadId], references: [id])

  date            DateTime @db.Date
  time            String
  partySize       Int
  specialRequests String?  @db.Text

  externalBookingId String?
  aiSessionId       String?

  status          String   @default("pending")
  // pending | held | confirmed | cancelled | no_show | completed

  holdExpiresAt   DateTime?
  heldAt          DateTime?

  // Source tracking
  aiPlatform      String?  // "openai" | "gemini"
  clickId         String?
  leadId          String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  confirmedAt     DateTime?
  cancelledAt     DateTime?

  @@index([providerId, status])
  @@index([date])
  @@index([externalBookingId])
  @@map("bookings")
}

model CustomerLead {
  id            String   @id @default(cuid())
  email         String?
  phone         String?
  firstName     String?
  lastName      String?
  fingerprint   String?  @unique

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  bookings      Booking[]

  @@index([email])
  @@index([phone])
  @@map("customer_leads")
}

model WebhookLog {
  id              String   @id @default(cuid())
  source          String
  eventType       String
  externalEventId String?
  integrationId   String?
  payload         Json
  status          String   @default("received")
  errorMessage    String?  @db.Text
  processedAt     DateTime?
  createdAt       DateTime @default(now())

  @@unique([source, externalEventId])
  @@index([status])
  @@map("webhook_logs")
}
```

**What's removed vs. full plan**: Campaign, AnalyticsDaily, ProviderMedia, ProviderTag (tags inlined as String[] on Provider), Payment.

---

## MVP Project Structure (Simplified)

```
AiBooker/
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── index.ts
│   │       ├── app.ts
│   │       ├── config/             # env loader, DB config, logger
│   │       ├── middleware/         # auth, webhookAuth, aiPlatformAuth, rateLimiter, errorHandler
│   │       ├── routes/v1/
│   │       │   ├── integrations.ts # activate, validate
│   │       │   ├── webhooks.ts     # 5 webhook endpoints
│   │       │   ├── ai-tools.ts     # search, availability, book, status
│   │       │   └── dashboard.ts    # login, profile (read-only)
│   │       ├── services/
│   │       │   ├── integration.service.ts
│   │       │   ├── webhook.service.ts
│   │       │   ├── search.service.ts    # search + basic relevance ranking
│   │       │   ├── availability.service.ts
│   │       │   ├── booking.service.ts   # hold + partner handoff
│   │       │   └── provider.service.ts
│   │       ├── connectors/
│   │       │   ├── base.connector.ts
│   │       │   ├── jimani.connector.ts
│   │       │   └── connector.factory.ts
│   │       ├── jobs/
│   │       │   ├── queue.ts
│   │       │   ├── workers/webhook.worker.ts
│   │       │   └── schedulers/
│   │       │       ├── staleSlotCleanup.ts
│   │       │       └── holdExpiry.ts
│   │       ├── schemas/            # Zod validation
│   │       └── utils/              # geo, hmac, idempotency
│   │
│   └── dashboard/                  # Minimal Next.js
│       └── src/
│           ├── app/
│           │   ├── (auth)/login/page.tsx
│           │   ├── (auth)/onboarding/page.tsx  # 3-step stepper
│           │   └── (dashboard)/
│           │       └── profile/page.tsx         # Read-only profile view
│           ├── components/
│           │   ├── ui/              # shadcn/ui basics
│           │   └── layout/
│           │       ├── OnboardingStepper.tsx
│           │       └── Sidebar.tsx
│           └── lib/
│               ├── api.ts
│               └── auth.ts
│
├── packages/
│   ├── database/                   # Prisma schema + migrations
│   └── shared/                     # Types, constants
│
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## MVP Jimani Endpoints (Mandatory Only)

### Layer 1: Onboarding & Sync (Jimani -> AiBooker)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/integrations/activate` | POST | Jimani activates integration with secure token + restaurant ID |
| `/v1/integrations/validate` | POST | Heartbeat check |
| `/v1/webhooks/provider-updated` | POST | Restaurant profile data push |
| `/v1/webhooks/booking-types-updated` | POST | Booking types sync |
| `/v1/webhooks/availability-updated` | POST | Availability slots push (every 5 min or on change) |

### Layer 2: Transaction Flow (AiBooker -> Jimani)

| Endpoint (on Jimani) | Method | Description |
|----------------------|--------|-------------|
| `/v1/aibooker/availability/check` | POST | Real-time availability check, returns alternative times |
| `/v1/aibooker/bookings` | POST | Create booking with customer details + source attribution |

### Layer 3: Feedback Loop (Jimani -> AiBooker)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/webhooks/booking-updated` | POST | Booking status changed (confirmed, cancelled, etc.) |

**Deferred**: `GET /bookings/{id}`, `DELETE /bookings/{id}`, `booking-email-updated` webhook.

---

## MVP AI Tool Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /v1/ai/search` | Search restaurants by city, cuisine, date, time, party size, tags. Returns relevance-ranked results. |
| `POST /v1/ai/availability` | Check real-time availability for a specific restaurant. Returns available times + alternatives. |
| `POST /v1/ai/book` | Create booking with 300s hold, forward to Jimani. Returns booking ID + status. |
| `POST /v1/ai/booking-status` | Get current status of a booking. |

### MVP Ranking: Relevance Only (0-50)

No campaigns or ad boost in MVP. Simplified scoring:

| Factor | Max Points | Logic |
|--------|-----------|-------|
| Cuisine match | 15 | Exact = 15, partial overlap = 10 |
| Location distance | 15 | < 1km = 15, linear decay to 0 at 10km |
| Time match | 10 | Within 30min = 10, within 60min = 5 |
| Party size fit | 5 | Exact within range = 5, near boundary = 3 |
| Available slots count | 5 | More slots = higher score |

Quality score and ad boost are deferred to the full plan.

---

## MVP Booking Flow

```
AI platform calls POST /v1/ai/book
    │
    ├── 1. Validate booking details (Zod)
    ├── 2. Live availability check (AiBooker → Jimani)
    ├── 3. Place hold (status=held, holdExpiresAt=now+300s)
    ├── 4. Create/dedup CustomerLead
    ├── 5. Create Booking in AiBooker DB (status=pending)
    ├── 6. Forward to Jimani: POST /v1/aibooker/bookings
    │       Jimani handles payment + email confirmation
    ├── 7. Store externalBookingId
    ├── 8. Return booking ID + status to AI platform
    │
    ▼
Jimani processes (payment, email)
    │
    ▼
POST /v1/webhooks/booking-updated
    │
    ├── IF confirmed → status = "confirmed"
    └── IF cancelled → status = "cancelled", release hold

Hold expiry scheduler (every 30s):
    └── Expired holds → status = "cancelled"
```

---

## MVP Dashboard (Minimal)

Only 3 pages:

| Page | Purpose |
|------|---------|
| `/login` | Magic link from Jimani (token validation) OR email/password |
| `/onboarding` | 3-step stepper: (1) Verify business info (pre-filled from webhook, read-only) → (2) Review booking types (read-only) → (3) Confirm + Go Live |
| `/profile` | Read-only view of restaurant profile, location, booking types, recent bookings list |

**No editing, no media upload, no campaigns, no analytics charts in MVP.** The dashboard just lets the restaurant verify their data and go live.

---

## MVP 3-Week Roadmap

### Week 1: Foundation + Jimani Integration

| Day | Task | Owner |
|-----|------|-------|
| D1 | Monorepo setup (pnpm + Turborepo), Docker Compose (PG + Redis), CI pipeline | Dev A |
| D1 | Prisma schema (MVP subset), initial migration, shared types package | Dev B |
| D2 | Fastify API skeleton: health, config, logger, error handler | Dev A |
| D2 | Next.js dashboard skeleton: layout, login page shell | Dev B |
| D3 | Integration activation endpoint + validation endpoint (Layer 1) | Dev A |
| D3 | Webhook auth middleware (HMAC-SHA256) + Zod schemas for all webhooks | Dev B |
| D4 | BullMQ setup + webhook worker + webhook processing service | Dev A |
| D4 | Jimani connector: client + mapper (provider, booking types, availability) | Dev B |
| D5 | All 5 webhook receiver routes + idempotency + DB upserts | Dev A |
| D5 | Integration tests: Jimani activate → push webhooks → verify DB state | Both |

**Exit**: Jimani can activate and push data. Provider + booking types + availability slots land in DB.

### Week 2: Search + Booking + AI Specs

| Day | Task | Owner |
|-----|------|-------|
| D1 | Search service: filter query + relevance scoring + geo distance | Dev A |
| D1 | AI platform auth middleware (bearer token) + rate limiting | Dev B |
| D2 | `POST /v1/ai/search` endpoint + response formatting | Dev A |
| D2 | Jimani availability connector: `POST /v1/aibooker/availability/check` + alternative times | Dev B |
| D3 | `POST /v1/ai/availability` endpoint (local check + live Jimani check) | Dev A |
| D3 | Jimani booking connector: `POST /v1/aibooker/bookings` with source attribution | Dev B |
| D4 | `POST /v1/ai/book` — hold mechanism (300s) + partner handoff + customer lead dedup | Dev A |
| D4 | `POST /v1/ai/booking-status` + booking-updated webhook processing | Dev B |
| D4 | Hold expiry scheduler + stale slot cleanup scheduler | Dev A |
| D5 | OpenAI Actions schema (OpenAPI 3.1) + Gemini function declarations | Dev A |
| D5 | Integration tests: full flow search → availability → book → partner confirm | Both |

**Exit**: Full booking loop works via AI function calls. Hold mechanism works. OpenAI + Gemini specs ready.

### Week 3: Dashboard + Deploy + UAT

| Day | Task | Owner |
|-----|------|-------|
| D1 | Dashboard auth: magic link token validation from Jimani + session (JWT) | Dev B |
| D1 | Dashboard API: `/v1/dashboard/auth/login`, `/v1/dashboard/providers/me` | Dev A |
| D2 | Onboarding stepper: 3 steps (verify info → review booking types → go live) | Dev B |
| D2 | Profile page: read-only view of provider data + recent bookings list | Dev B |
| D2 | Deploy: Railway setup (API + Dashboard + PG + Redis), Cloudflare DNS | Dev A |
| D3 | Security: helmet headers, input validation audit, secret redaction in logs | Dev A |
| D3 | Dashboard polish: responsive layout, error states, loading states | Dev B |
| D4 | Staging deploy + smoke test all endpoints | Dev A |
| D4 | Unit tests: ranking, geo, hmac, mapper, webhook idempotency | Both |
| D5 | UAT with Jimani test environment — full end-to-end validation | Both |

**Exit**: MVP deployed to staging. Jimani integration tested end-to-end. Dashboard onboarding works. AI platforms can search and book.

---

## MVP Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# Encryption
ENCRYPTION_KEY=base64-encoded-32-byte-key

# JWT
JWT_SECRET=random-256-bit-secret

# AI Platform API Keys (issued by AiBooker)
OPENAI_AIBOOKER_KEY=ak_openai_...
GEMINI_AIBOOKER_KEY=ak_gemini_...

# Jimani
JIMANI_BASE_URL=https://api.jimani.nl
JIMANI_API_KEY=...

# App
NODE_ENV=production
API_PORT=4000
DASHBOARD_URL=https://dashboard.aibooker.nl
API_URL=https://api.aibooker.nl
```

---

## MVP Exit Criteria (Definition of Done)

- [ ] Jimani can activate an integration via `POST /v1/integrations/activate`
- [ ] Jimani webhooks populate provider, booking types, and availability in DB
- [ ] `POST /v1/ai/search` returns relevance-ranked restaurants with availability
- [ ] `POST /v1/ai/availability` returns real-time availability + alternative times from Jimani
- [ ] `POST /v1/ai/book` creates booking with 300s hold, forwards to Jimani, returns booking ID
- [ ] Jimani `booking-updated` webhook updates booking status in AiBooker
- [ ] Expired holds are auto-released by scheduler
- [ ] OpenAI Actions schema validates successfully
- [ ] Gemini function declarations work in test
- [ ] Restaurant can log in via magic link, complete onboarding, see profile
- [ ] Deployed to staging with HTTPS, health checks passing
- [ ] All critical paths covered by integration tests

---

## MVP → Full Plan Bridge

After MVP ships, the path to the full plan:

| Priority | Feature | Effort |
|----------|---------|--------|
| P0 | Profile editing in dashboard | 2-3 days |
| P0 | Media upload (S3/R2) | 2 days |
| P1 | Campaign system (CPC/CPA) + ad boost in ranking | 1 week |
| P1 | Quality score in ranking | 2-3 days |
| P1 | Analytics dashboard + charts | 1 week |
| P2 | Zenchef connector | 1 week |
| P2 | Booking cancellation + retrieval endpoints | 2-3 days |
| P2 | Email status webhook | 1 day |
| P2 | Availability polling (5-min) | 1-2 days |
| P3 | Load testing, E2E tests, security hardening | 1 week |

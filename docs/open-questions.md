# AiBooker -- Open Questions for Implementation

Questions grouped by area. Each needs a decision before or during implementation.

---

## 1. Jimani Integration Contract

| # | Question | Why It Matters | Suggested Default |
|---|----------|---------------|-------------------|
| 1.1 | **What exact JSON payload does Jimani send in each webhook?** Do we have sample payloads for all 5 events (provider-updated, booking-types-updated, availability-updated, booking-updated, booking-email-updated)? | Without real payload samples, our Zod schemas and mappers will be guesswork. We need field names, types, nested structures, and edge cases (null fields, empty arrays). | Request Jimani to provide sample payloads for each event or access to their API docs. |
| 1.2 | **What does Jimani's activation endpoint expect?** When Jimani calls `POST /v1/integrations/activate`, what fields does it send? Just a token + restaurant ID, or more (restaurant name, contact, etc.)? | Determines whether the first webhook is even needed — if activation already sends full restaurant data, we can pre-populate the Provider immediately. | Assume activation sends minimal data (token + external ID), and first `provider-updated` webhook sends full profile. |
| 1.3 | **How does Jimani generate the webhook secret?** Does Jimani generate it and share it during activation, or does AiBooker generate it and return it to Jimani? | Affects the activation flow logic. | AiBooker generates the `webhookSecret` during activation and returns it in the response. Jimani stores it for signing future payloads. |
| 1.4 | **What does Jimani's `POST /v1/aibooker/availability/check` response look like?** Does it return a flat list of available slots, or structured by booking type? Does it include alternative times natively, or do we compute alternatives ourselves? | Our `check_availability` response promises alternative times. We need to know if Jimani provides them or if we derive them from their slot data. | Assume Jimani returns available slots for the date; we compute "alternative times" by finding nearby slots when the exact time is unavailable. |
| 1.5 | **What does Jimani's `POST /v1/aibooker/bookings` request/response look like?** What fields are required? Does it return a booking ID synchronously, or is confirmation async via webhook? | Determines whether `POST /v1/ai/book` can return a confirmed booking immediately or always returns "pending". | Assume Jimani returns `externalBookingId` synchronously with status "pending". Confirmation comes async via `booking-updated` webhook. |
| 1.6 | **Does Jimani support the 300s hold natively?** Or is the hold purely AiBooker-side (we hold the slot in our DB, but Jimani doesn't know about it)? | If Jimani doesn't support holds, there's a race condition: another system could book the same slot during our 300s hold. | Clarify with Jimani. If no native hold, we accept the race condition risk for MVP and note it as a known limitation. |
| 1.7 | **What is the Jimani API base URL for each environment?** Sandbox/test vs. production URLs? API versioning scheme? | Needed for connector configuration. | Need from Jimani: test URL + production URL. |
| 1.8 | **How does Jimani handle errors?** What HTTP status codes and error response formats does their API return? | Our connector needs proper error handling and retry logic. | Request Jimani's error response format. Assume standard HTTP codes + JSON error body. |
| 1.9 | **Does Jimani send webhooks for ALL restaurants or only activated ones?** Could we receive webhooks for a restaurant we haven't activated? | Affects webhook validation — do we reject unknown integrations or auto-create them? | Reject webhooks for unknown integrations with 404. Only process webhooks for activated integrations. |

---

## 2. Authentication & Security

| # | Question | Why It Matters | Suggested Default |
|---|----------|---------------|-------------------|
| 2.1 | **How does the magic link flow work exactly?** Does Jimani redirect the user to `https://dashboard.aibooker.nl/auth/magic?token=xxx`, or do they POST the token to our API? What user info is in the token? | Determines the frontend auth flow and token validation logic. | Assume Jimani redirects to our URL with a signed JWT containing `{ integrationId, email, externalId }`. AiBooker validates signature, creates session. |
| 2.2 | **Who generates the AI platform API keys?** Are they static keys we manually configure per platform, or dynamically issued? How do we onboard a new AI platform (e.g., Grok)? | Affects whether we need an API key management system or just env vars. | Static keys in env vars for MVP. One key per platform, manually rotated. |
| 2.3 | **JWT signing: symmetric (HS256) or asymmetric (RS256)?** The plan says RS256 for dashboard auth, but that requires key pair management. | RS256 is more secure but adds complexity. | HS256 for MVP (simpler). Upgrade to RS256 post-MVP if needed. |
| 2.4 | **How is `Integration.credentials` encrypted?** The plan says AES-256-GCM. Do we use a library like `node:crypto`, or a KMS? How do we handle key rotation? | Encryption implementation detail. | `node:crypto` with AES-256-GCM for MVP. Encryption key from `ENCRYPTION_KEY` env var. Key rotation = re-encrypt all records with new key (manual process for MVP). |

---

## 3. Search & Ranking

| # | Question | Why It Matters | Suggested Default |
|---|----------|---------------|-------------------|
| 3.1 | **What happens when no city is provided in the search?** Do we search all cities? Require lat/lng? Return an error? | AI platforms may call search without a city if the user didn't specify one. | If no city AND no lat/lng, return error: "Please specify a city or location." If lat/lng provided, search within `maxDistanceKm` (default 10km). |
| 3.2 | **How do we handle cuisine type matching?** Is it exact match only, or fuzzy? If user says "Italian" and restaurant has "italian" — case sensitivity? What about "Mediterranean" matching "Italian"? | Affects search quality. | Case-insensitive exact match on cuisine tags. No fuzzy/semantic matching for MVP. AI platform should normalize cuisine names before calling. |
| 3.3 | **The search SQL references `provider_tags` table, but MVP uses `String[]` on Provider.** Which approach do we use? | The SQL query needs to match the actual schema. | MVP: use `provider.tags && $tags` (array overlap) instead of the JOIN to `provider_tags`. Full plan: migrate to separate table if needed for indexing at scale. |
| 3.4 | **What is the predefined list of cuisine types and tags?** Are they free-text or from a controlled vocabulary? | Affects validation, search matching, and the dashboard UI. | Define a constants file with allowed values. Cuisine: ~30 types (italian, japanese, dutch, etc.). Tags: ~15 tags (romantic, terrace, kid-friendly, etc.). Validate on webhook ingestion. |
| 3.5 | **How do we generate the `slug` for a Provider?** From the restaurant name? What about collisions (two restaurants named "De Keuken")? | Slug must be unique. | `slugify(name)` + append city + numeric suffix if collision: `de-keuken-amsterdam`, `de-keuken-amsterdam-2`. |
| 3.6 | **Should search results include restaurants with no availability slots?** If a restaurant has no slots for the requested date but matches other criteria? | Showing unavailable restaurants is frustrating; hiding them reduces choice. | Only return restaurants with at least 1 matching availability slot (the `HAVING COUNT > 0` clause). |

---

## 4. Booking Flow

| # | Question | Why It Matters | Suggested Default |
|---|----------|---------------|-------------------|
| 4.1 | **What happens if Jimani rejects the booking?** (e.g., slot was taken between our check and the actual booking call) | Need error handling + response to AI platform. | Return error to AI platform: "This time slot is no longer available. Please check availability again." Include alternative times if possible. |
| 4.2 | **Can a customer book multiple times at the same restaurant for the same date/time?** | Need to decide on duplicate booking prevention. | Allow it — the customer might be booking for different groups. Jimani will reject if it's truly a duplicate on their side. |
| 4.3 | **What customer data is required vs. optional?** The AI tool schema requires first_name, last_name, email, phone. Will AI platforms always have this? | ChatGPT might not have the user's phone number. Requiring all 4 fields could block bookings. | Make `phone` optional for MVP. Email is the minimum required identifier. Jimani may require phone — check with them. |
| 4.4 | **What language does the customer speak?** The Miro spec mentions multi-language support and customer language preferences. | Jimani may need language for email confirmations. | Add `language` field to booking (default: "nl"). AI platform can pass it based on conversation language. |
| 4.5 | **How do we handle the hold if the AI platform never calls `book` after `availability`?** | The hold is created at book time, not availability check time. But should we reserve capacity during availability check? | No hold during availability check — only at booking time. Availability is informational only. Accept the risk of stale data between check and book. |
| 4.6 | **What if the partner webhook for booking confirmation never arrives?** How long do we wait before timing out? | Booking stuck in "pending" forever is bad UX. | If no `booking-updated` webhook received within 10 minutes after partner handoff, mark booking as "pending_timeout" and log an alert. Don't auto-cancel — it may still be processing on partner side. |
| 4.7 | **Should `POST /v1/ai/book` be idempotent?** If the AI platform retries the same booking request, do we create a duplicate? | AI platforms may retry on timeout. | Yes — use `aiSessionId` + `providerId` + `date` + `time` as an idempotency key. If duplicate detected, return the existing booking instead of creating a new one. |

---

## 5. Dashboard & Onboarding

| # | Question | Why It Matters | Suggested Default |
|---|----------|---------------|-------------------|
| 5.1 | **What does "Go Live" mean in onboarding step 3?** Does it just set `provider.status = 'active'`, or does it also notify Jimani? | Determines if there's a callback to Jimani on go-live. | Sets `provider.status = 'active'` in AiBooker only. Jimani already knows the restaurant exists (they initiated the activation). No callback needed. |
| 5.2 | **Can a restaurant pause/unpause their listing?** If so, from the dashboard? | Restaurants may want to temporarily stop appearing in search (holidays, renovations). | Yes — add a "Pause listing" toggle in dashboard that sets `provider.status = 'paused'`. Paused providers are excluded from search. |
| 5.3 | **What happens if webhook data conflicts with dashboard edits?** E.g., restaurant updates name in dashboard, then Jimani sends a `provider-updated` webhook with the old name. | Data ownership conflict. | Per Miro spec: restaurant details (name, description, cuisine, tags) are **editable** in AiBooker. Webhook data for these fields should NOT overwrite dashboard edits. Only sync fields that are read-only from partner (booking types, availability). |
| 5.4 | **Is the dashboard a separate domain or a subdomain?** `dashboard.aibooker.nl` vs. `aibooker.nl/dashboard`? | Affects CORS config, cookie domains, deployment setup. | Separate subdomain: `dashboard.aibooker.nl`. API at `api.aibooker.nl`. Set cookie domain to `.aibooker.nl` for cross-subdomain auth. |
| 5.5 | **How does password setup work?** The onboarding flow starts with magic link from Jimani, but the restaurant needs a password for future logins. | Need a "set password" step somewhere in the flow. | After magic link login, prompt to set password as part of onboarding step 1 (or on first visit to settings). Magic link remains available as alternative login method. |

---

## 6. Data & Infrastructure

| # | Question | Why It Matters | Suggested Default |
|---|----------|---------------|-------------------|
| 6.1 | **What timezone should availability slots use?** The schema says `startTime` is "18:00" (local time). But local time in which zone? | Netherlands is CET/CEST (UTC+1/+2). Daylight saving transitions could cause issues. | All times are **Europe/Amsterdam** timezone. Store as string ("18:00") with implicit Amsterdam timezone. Convert to UTC only when comparing with `NOW()` in queries. |
| 6.2 | **How do we handle the `expiresAt` for availability slots?** Who sets it — Jimani via webhook, or AiBooker with a default TTL? | Determines when stale data gets cleaned up. | If Jimani sends `expiresAt`, use it. Otherwise, default to `date + endTime + 1 hour` (slot expires 1 hour after its end time). Stale cleanup job removes expired slots hourly. |
| 6.3 | **Database connection pooling — PgBouncer or Prisma's built-in?** | Affects connection limits, especially under load. | Prisma's built-in connection pool for MVP (`connection_limit` in DATABASE_URL). PgBouncer post-MVP if connection limits become an issue. |
| 6.4 | **Redis persistence — do we need it?** If Redis restarts, BullMQ jobs are lost. | Webhook jobs in the queue could be lost on Redis restart. | Enable Redis AOF persistence (appendonly yes). Railway's managed Redis has persistence by default. |
| 6.5 | **How much data do we expect at MVP launch?** Number of restaurants, slots per restaurant, bookings per day? | Affects index strategy, query performance, and infrastructure sizing. | Estimate for MVP: ~50-100 restaurants, ~500 slots per restaurant per week, ~10-50 bookings per day. Single Railway instance should handle this comfortably. |
| 6.6 | **Do we need database backups from day 1?** | Data loss risk. | Yes — Railway provides daily automated backups. Verify this is enabled. |

---

## 7. AI Platform Integration

| # | Question | Why It Matters | Suggested Default |
|---|----------|---------------|-------------------|
| 7.1 | **How do we register AiBooker as a ChatGPT Action?** Is it via the OpenAI developer portal? Do we need approval? | There may be a review/approval process before ChatGPT users can use AiBooker. | Register via OpenAI's GPT Actions. Requires an OpenAPI spec + authentication. May need review. Start the registration process in Week 2 since approval can take time. |
| 7.2 | **How do we register with Gemini?** Is it Google AI Studio, or Vertex AI? | Gemini function calling works differently than OpenAI Actions. | Gemini function calling is defined in the client code (whoever builds the Gemini-based chatbot). AiBooker provides the API + docs; the integrator registers the functions. |
| 7.3 | **Who is the end user?** Is it a consumer talking to ChatGPT, or a custom chatbot built by a third party? | Affects how we think about the AI integration — plugin vs. API. | Both. AiBooker's API can be consumed by: (a) ChatGPT Actions (consumer-facing), (b) custom chatbots built by third parties using Gemini/OpenAI function calling. |
| 7.4 | **How does the AI platform convey the payment link to the user?** Since partner handles payment, does Jimani return a payment URL in the booking response that we pass through? | If there's a deposit, the user needs to pay somehow. We don't handle payment, but we may need to relay a URL. | Check with Jimani: does their booking response include a `paymentUrl`? If yes, pass it through in our `create_booking` response. If no, the partner handles payment via email to the guest. |
| 7.5 | **Rate limiting — what are realistic limits for MVP?** 300 req/min per AI platform seems high for MVP. | Over-provisioning wastes resources; under-provisioning blocks legitimate traffic. | MVP: 60 req/min per AI platform, 500 req/min for webhooks, 30 req/min for dashboard. Adjust based on actual usage. |

---

## 8. Business / Product

| # | Question | Why It Matters | Suggested Default |
|---|----------|---------------|-------------------|
| 8.1 | **What is AiBooker's revenue model for MVP?** No campaigns, no payment processing. How does AiBooker make money? | Affects whether we need any billing/tracking infrastructure in MVP. | MVP is free / pre-revenue. Revenue comes post-MVP via campaign system (CPC/CPA). MVP goal is to prove the booking flow works and get restaurants onboarded. |
| 8.2 | **Is there an SLA with Jimani?** Expected uptime, response times for their API, webhook delivery guarantees? | Affects our error handling, retry logic, and what we promise to AI platforms. | Clarify with Jimani. Design for their API being occasionally slow/down: timeouts (5s for availability check, 10s for booking), retry with backoff, graceful degradation in search (skip live check if Jimani is down, rely on cached slots). |
| 8.3 | **Netherlands only, or other countries too?** The plan assumes NL (country default "NL", EUR currency). | Affects schema, validation, timezone handling. | NL only for MVP. Country field exists in schema for future expansion but is hardcoded to "NL". |
| 8.4 | **GDPR — do we need a privacy policy and cookie consent for MVP?** | Legal requirement in EU. | Yes — basic privacy policy at `aibooker.nl/privacy`. Dashboard needs cookie consent banner. Customer data retention: discuss with legal. |
| 8.5 | **Who owns the customer data?** AiBooker or the restaurant? | Affects data processing agreements and GDPR responsibilities. | AiBooker is a data processor; the restaurant (via Jimani) is the data controller. Need a data processing agreement template. For MVP, document this but don't block launch. |

---

## Priority: Must Resolve Before Coding

These questions **block implementation** and should be answered first:

1. **1.1** — Jimani webhook payload samples (blocks schema/mapper work)
2. **1.2** — Jimani activation payload (blocks activation endpoint)
3. **1.4** — Jimani availability response format (blocks availability service)
4. **1.5** — Jimani booking request/response format (blocks booking service)
5. **1.6** — Does Jimani support native holds? (blocks hold design)
6. **1.7** — Jimani API URLs for test/prod (blocks connector)
7. **2.1** — Magic link flow details (blocks dashboard auth)
8. **7.4** — Does Jimani return a payment URL? (blocks booking response design)

Everything else can be decided during implementation with the suggested defaults.

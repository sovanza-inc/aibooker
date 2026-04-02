import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  doublePrecision,
  json,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// AiBooker Domain Tables
// ---------------------------------------------------------------------------

// Integrations — one per restaurant per booking partner (e.g. Jimani)
export const integrations = pgTable('integrations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  source: varchar('source', { length: 50 }).notNull(), // "jimani", "zenchef"
  externalId: varchar('external_id', { length: 255 }).notNull(), // Restaurant ID on partner
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending | active | suspended
  apiKey: varchar('api_key', { length: 255 }).notNull().unique(),
  webhookSecret: varchar('webhook_secret', { length: 255 }).notNull(),
  credentials: json('credentials'), // Encrypted partner API credentials
  activatedAt: timestamp('activated_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('integrations_source_external_id_idx').on(table.source, table.externalId),
]);

// Providers — restaurants, salons, etc.
export const providers = pgTable('providers', {
  id: serial('id').primaryKey(),
  integrationId: integer('integration_id')
    .notNull()
    .unique()
    .references(() => integrations.id),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  cuisineType: json('cuisine_type').$type<string[]>().default([]), // ["italian", "pizza"]
  tags: json('tags').$type<string[]>().default([]), // ["romantic", "terrace"]
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 500 }),
  priceRange: integer('price_range'), // 1-4
  rating: doublePrecision('rating'),
  status: varchar('status', { length: 20 }).notNull().default('onboarding'), // onboarding | active | paused
  dashboardEmail: varchar('dashboard_email', { length: 255 }).unique(),
  dashboardPasswordHash: text('dashboard_password_hash'),
  // Business info fields (AI context — from Settings > Business Information)
  logo: varchar('logo', { length: 500 }),
  aboutCompany: text('about_company'),
  whatIsThisBusiness: text('what_is_this_business'),
  whatCanIBookHere: text('what_can_i_book_here'),
  whenShouldRecommend: text('when_should_recommend'),
  whatCanCustomersBook: json('what_can_customers_book').$type<string[]>().default([]),
  bestFor: json('best_for').$type<string[]>().default([]),
  atmosphere: json('atmosphere').$type<string[]>().default([]),
  whatMakesUnique: text('what_makes_unique'),
  whenShouldChoose: text('when_should_choose'),
  whenShouldNotChoose: text('when_should_not_choose'),
  popularDishes: text('popular_dishes'),
  // Guest sizes & pricing
  minGuestSize: integer('min_guest_size').default(1),
  maxGuestSize: integer('max_guest_size').default(20),
  priceRangeFrom: doublePrecision('price_range_from'),
  priceRangeTo: doublePrecision('price_range_to'),
  targetAudience: json('target_audience').$type<string[]>().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('providers_status_idx').on(table.status),
]);

// Provider Locations — address + geo
export const providerLocations = pgTable('provider_locations', {
  id: serial('id').primaryKey(),
  providerId: integer('provider_id')
    .notNull()
    .unique()
    .references(() => providers.id, { onDelete: 'cascade' }),
  streetAddress: varchar('street_address', { length: 500 }).notNull(),
  city: varchar('city', { length: 255 }).notNull(),
  postalCode: varchar('postal_code', { length: 20 }).notNull(),
  country: varchar('country', { length: 10 }).notNull().default('NL'),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('provider_locations_city_idx').on(table.city),
  index('provider_locations_geo_idx').on(table.latitude, table.longitude),
]);

// Booking Types — "Lunch", "Dinner", etc.
export const bookingTypes = pgTable('booking_types', {
  id: serial('id').primaryKey(),
  providerId: integer('provider_id')
    .notNull()
    .references(() => providers.id, { onDelete: 'cascade' }),
  externalId: varchar('external_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).default('restaurant'), // restaurant, salon, activity, etc.
  minPartySize: integer('min_party_size').notNull().default(1),
  maxPartySize: integer('max_party_size').notNull().default(20),
  duration: integer('duration').notNull().default(120), // minutes
  averagePricePerPerson: doublePrecision('average_price_per_person'),
  isActive: boolean('is_active').notNull().default(true),
  settings: json('settings'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('booking_types_provider_external_idx').on(table.providerId, table.externalId),
  index('booking_types_provider_active_idx').on(table.providerId, table.isActive),
]);

// Availability Slots — time slots synced from partner
export const availabilitySlots = pgTable('availability_slots', {
  id: serial('id').primaryKey(),
  bookingTypeId: integer('booking_type_id')
    .notNull()
    .references(() => bookingTypes.id, { onDelete: 'cascade' }),
  date: timestamp('date', { mode: 'date' }).notNull(),
  startTime: varchar('start_time', { length: 10 }).notNull(), // "18:00"
  endTime: varchar('end_time', { length: 10 }).notNull(), // "20:00"
  capacity: integer('capacity').notNull(),
  maxPartySize: integer('max_party_size'),
  externalId: varchar('external_id', { length: 255 }),
  lastSyncedAt: timestamp('last_synced_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
}, (table) => [
  uniqueIndex('availability_slots_unique_idx').on(table.bookingTypeId, table.date, table.startTime),
  index('availability_slots_date_time_idx').on(table.date, table.startTime),
  index('availability_slots_expires_idx').on(table.expiresAt),
]);

// Opening Hours — daily schedule for providers
export const openingHours = pgTable('opening_hours', {
  id: serial('id').primaryKey(),
  providerId: integer('provider_id')
    .notNull()
    .references(() => providers.id, { onDelete: 'cascade' }),
  date: timestamp('date', { mode: 'date' }).notNull(),
  openTime: varchar('open_time', { length: 10 }), // "08:00" or null if closed
  closeTime: varchar('close_time', { length: 10 }), // "21:30" or null if closed
  isClosed: boolean('is_closed').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('opening_hours_provider_date_idx').on(table.providerId, table.date),
]);

// Customer Leads — end customers who book through AI
export const customerLeads = pgTable('customer_leads', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  fingerprint: varchar('fingerprint', { length: 255 }).unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('customer_leads_email_idx').on(table.email),
  index('customer_leads_phone_idx').on(table.phone),
]);

// Bookings — actual reservations
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  providerId: integer('provider_id')
    .notNull()
    .references(() => providers.id),
  bookingTypeId: integer('booking_type_id')
    .notNull()
    .references(() => bookingTypes.id),
  customerLeadId: integer('customer_lead_id')
    .notNull()
    .references(() => customerLeads.id),
  date: timestamp('date', { mode: 'date' }).notNull(),
  time: varchar('time', { length: 10 }).notNull(),
  partySize: integer('party_size').notNull(),
  specialRequests: text('special_requests'),
  externalBookingId: varchar('external_booking_id', { length: 255 }),
  aiSessionId: varchar('ai_session_id', { length: 255 }),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  // pending | held | confirmed | cancelled | no_show | completed
  holdExpiresAt: timestamp('hold_expires_at'),
  heldAt: timestamp('held_at'),
  aiPlatform: varchar('ai_platform', { length: 50 }), // "openai" | "gemini" | "claude"
  clickId: varchar('click_id', { length: 255 }),
  leadId: varchar('lead_id', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  confirmedAt: timestamp('confirmed_at'),
  cancelledAt: timestamp('cancelled_at'),
}, (table) => [
  index('bookings_provider_status_idx').on(table.providerId, table.status),
  index('bookings_date_idx').on(table.date),
  index('bookings_external_id_idx').on(table.externalBookingId),
]);

// Webhook Logs — track all incoming webhooks
export const webhookLogs = pgTable('webhook_logs', {
  id: serial('id').primaryKey(),
  source: varchar('source', { length: 50 }).notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  externalEventId: varchar('external_event_id', { length: 255 }),
  integrationId: integer('integration_id'),
  payload: json('payload').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('received'),
  // received | processing | processed | failed
  errorMessage: text('error_message'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('webhook_logs_source_event_idx').on(table.source, table.externalEventId),
  index('webhook_logs_status_idx').on(table.status),
]);

// ---------------------------------------------------------------------------
// AiBooker Relations
// ---------------------------------------------------------------------------

export const integrationsRelations = relations(integrations, ({ one, many }) => ({
  team: one(teams, {
    fields: [integrations.teamId],
    references: [teams.id],
  }),
  provider: one(providers),
}));

export const providersRelations = relations(providers, ({ one, many }) => ({
  integration: one(integrations, {
    fields: [providers.integrationId],
    references: [integrations.id],
  }),
  location: one(providerLocations),
  bookingTypes: many(bookingTypes),
  bookings: many(bookings),
  openingHours: many(openingHours),
}));

export const providerLocationsRelations = relations(providerLocations, ({ one }) => ({
  provider: one(providers, {
    fields: [providerLocations.providerId],
    references: [providers.id],
  }),
}));

export const bookingTypesRelations = relations(bookingTypes, ({ one, many }) => ({
  provider: one(providers, {
    fields: [bookingTypes.providerId],
    references: [providers.id],
  }),
  availabilitySlots: many(availabilitySlots),
  bookings: many(bookings),
}));

export const availabilitySlotsRelations = relations(availabilitySlots, ({ one }) => ({
  bookingType: one(bookingTypes, {
    fields: [availabilitySlots.bookingTypeId],
    references: [bookingTypes.id],
  }),
}));

export const openingHoursRelations = relations(openingHours, ({ one }) => ({
  provider: one(providers, {
    fields: [openingHours.providerId],
    references: [providers.id],
  }),
}));

export const customerLeadsRelations = relations(customerLeads, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  provider: one(providers, {
    fields: [bookings.providerId],
    references: [providers.id],
  }),
  bookingType: one(bookingTypes, {
    fields: [bookings.bookingTypeId],
    references: [bookingTypes.id],
  }),
  customerLead: one(customerLeads, {
    fields: [bookings.customerLeadId],
    references: [customerLeads.id],
  }),
}));

// ---------------------------------------------------------------------------
// Type Exports
// ---------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export type Integration = typeof integrations.$inferSelect;
export type NewIntegration = typeof integrations.$inferInsert;
export type Provider = typeof providers.$inferSelect;
export type NewProvider = typeof providers.$inferInsert;
export type ProviderLocation = typeof providerLocations.$inferSelect;
export type NewProviderLocation = typeof providerLocations.$inferInsert;
export type BookingType = typeof bookingTypes.$inferSelect;
export type NewBookingType = typeof bookingTypes.$inferInsert;
export type AvailabilitySlot = typeof availabilitySlots.$inferSelect;
export type NewAvailabilitySlot = typeof availabilitySlots.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type CustomerLead = typeof customerLeads.$inferSelect;
export type NewCustomerLead = typeof customerLeads.$inferInsert;
export type WebhookLog = typeof webhookLogs.$inferSelect;
export type NewWebhookLog = typeof webhookLogs.$inferInsert;
export type OpeningHour = typeof openingHours.$inferSelect;
export type NewOpeningHour = typeof openingHours.$inferInsert;

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}

import { db } from './drizzle';
import {
  providers,
  providerLocations,
  bookingTypes,
  availabilitySlots,
  bookings,
  customerLeads,
  openingHours,
  integrations,
  users,
  teamMembers,
} from './schema';
import { eq, and, desc, gte, lte, sql, count, asc } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

/** Get the provider linked to the currently authenticated user */
export async function getProviderForUser() {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  // Find provider where dashboardEmail matches user email
  const result = await db
    .select()
    .from(providers)
    .where(eq(providers.dashboardEmail, user.email))
    .limit(1);

  if (result.length > 0) return result[0];

  // Fallback: find provider via team → integration → provider
  const teamResult = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.id))
    .limit(1);

  if (teamResult.length === 0) return null;

  const intResult = await db
    .select()
    .from(integrations)
    .where(eq(integrations.teamId, teamResult[0].teamId))
    .limit(1);

  if (intResult.length === 0) return null;

  const provResult = await db
    .select()
    .from(providers)
    .where(eq(providers.integrationId, intResult[0].id))
    .limit(1);

  return provResult[0] || null;
}

/** Get provider with location */
export async function getProviderWithLocation(providerId: number) {
  const [provider] = await db
    .select()
    .from(providers)
    .where(eq(providers.id, providerId))
    .limit(1);

  if (!provider) return null;

  const [location] = await db
    .select()
    .from(providerLocations)
    .where(eq(providerLocations.providerId, providerId))
    .limit(1);

  return { ...provider, location: location || null };
}

/** Get dashboard stats for a provider */
export async function getProviderStats(providerId: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  // Today's bookings count
  const [todayCount] = await db
    .select({ count: count() })
    .from(bookings)
    .where(
      and(
        eq(bookings.providerId, providerId),
        gte(bookings.date, today),
        lte(bookings.date, tomorrow)
      )
    );

  // Upcoming bookings (next 7 days)
  const [upcomingCount] = await db
    .select({ count: count() })
    .from(bookings)
    .where(
      and(
        eq(bookings.providerId, providerId),
        gte(bookings.date, today),
        lte(bookings.date, weekFromNow)
      )
    );

  // Today's opening hours
  const [todayHours] = await db
    .select()
    .from(openingHours)
    .where(
      and(
        eq(openingHours.providerId, providerId),
        eq(openingHours.date, today)
      )
    )
    .limit(1);

  // Bookings by platform (all time)
  const platformStats = await db
    .select({
      platform: bookings.aiPlatform,
      count: count(),
    })
    .from(bookings)
    .where(eq(bookings.providerId, providerId))
    .groupBy(bookings.aiPlatform);

  // Weekly bookings (last 7 days)
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);

  const weeklyBookings = await db
    .select({
      date: bookings.date,
      count: count(),
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.providerId, providerId),
        gte(bookings.date, weekAgo),
        lte(bookings.date, tomorrow)
      )
    )
    .groupBy(bookings.date);

  // Total bookings for fill rate calc
  const [totalBookings] = await db
    .select({ count: count() })
    .from(bookings)
    .where(eq(bookings.providerId, providerId));

  // Today's total slot capacity for fill rate
  const [todayCapacityResult] = await db
    .select({ total: sql<number>`coalesce(sum(${availabilitySlots.capacity}), 0)` })
    .from(availabilitySlots)
    .innerJoin(bookingTypes, eq(availabilitySlots.bookingTypeId, bookingTypes.id))
    .where(
      and(
        eq(bookingTypes.providerId, providerId),
        gte(availabilitySlots.date, today),
        lte(availabilitySlots.date, tomorrow)
      )
    );

  const totalPlatform = platformStats.reduce((sum, p) => sum + Number(p.count), 0);

  return {
    todayCount: Number(todayCount?.count || 0),
    upcomingCount: Number(upcomingCount?.count || 0),
    totalBookings: Number(totalBookings?.count || 0),
    todayCapacity: Number(todayCapacityResult?.total || 0),
    todayHours: todayHours
      ? todayHours.isClosed
        ? 'Closed'
        : `${todayHours.openTime} - ${todayHours.closeTime}`
      : 'Not set',
    platformStats: platformStats.map((p) => ({
      platform: p.platform || 'unknown',
      count: Number(p.count),
      percentage: totalPlatform > 0 ? Math.round((Number(p.count) / totalPlatform) * 100) : 0,
    })),
    weeklyBookings: weeklyBookings.map((w) => ({
      date: w.date,
      count: Number(w.count),
    })),
  };
}

/** Get today's bookings for a provider */
export async function getTodayBookings(providerId: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return db
    .select({
      id: bookings.id,
      time: bookings.time,
      partySize: bookings.partySize,
      status: bookings.status,
      aiPlatform: bookings.aiPlatform,
      customerFirstName: customerLeads.firstName,
      customerLastName: customerLeads.lastName,
    })
    .from(bookings)
    .leftJoin(customerLeads, eq(bookings.customerLeadId, customerLeads.id))
    .where(
      and(
        eq(bookings.providerId, providerId),
        gte(bookings.date, today),
        lte(bookings.date, tomorrow)
      )
    )
    .orderBy(asc(bookings.time));
}

/** Get all bookings for a provider with filters */
export async function getProviderBookings(
  providerId: number,
  filters?: { status?: string; platform?: string; dateFrom?: string; dateTo?: string }
) {
  const conditions = [eq(bookings.providerId, providerId)];

  if (filters?.status && filters.status !== 'all') {
    conditions.push(eq(bookings.status, filters.status));
  }
  if (filters?.platform && filters.platform !== 'all') {
    conditions.push(eq(bookings.aiPlatform, filters.platform));
  }
  if (filters?.dateFrom) {
    conditions.push(gte(bookings.date, new Date(filters.dateFrom)));
  }
  if (filters?.dateTo) {
    conditions.push(lte(bookings.date, new Date(filters.dateTo)));
  }

  return db
    .select({
      id: bookings.id,
      date: bookings.date,
      time: bookings.time,
      partySize: bookings.partySize,
      status: bookings.status,
      aiPlatform: bookings.aiPlatform,
      specialRequests: bookings.specialRequests,
      externalBookingId: bookings.externalBookingId,
      createdAt: bookings.createdAt,
      confirmedAt: bookings.confirmedAt,
      cancelledAt: bookings.cancelledAt,
      customerFirstName: customerLeads.firstName,
      customerLastName: customerLeads.lastName,
      customerEmail: customerLeads.email,
      customerPhone: customerLeads.phone,
      bookingTypeName: bookingTypes.name,
    })
    .from(bookings)
    .leftJoin(customerLeads, eq(bookings.customerLeadId, customerLeads.id))
    .leftJoin(bookingTypes, eq(bookings.bookingTypeId, bookingTypes.id))
    .where(and(...conditions))
    .orderBy(desc(bookings.date), desc(bookings.time))
    .limit(100);
}

/** Get booking types for a provider */
export async function getProviderBookingTypes(providerId: number) {
  return db
    .select()
    .from(bookingTypes)
    .where(eq(bookingTypes.providerId, providerId))
    .orderBy(asc(bookingTypes.name));
}

/** Update a booking type */
export async function updateBookingType(
  bookingTypeId: number,
  providerId: number,
  data: {
    name?: string;
    description?: string;
    category?: string;
    minPartySize?: number;
    maxPartySize?: number;
    duration?: number;
    averagePricePerPerson?: number;
    isActive?: boolean;
  }
) {
  return db
    .update(bookingTypes)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(bookingTypes.id, bookingTypeId), eq(bookingTypes.providerId, providerId)))
    .returning();
}

/** Update provider settings */
export async function updateProviderSettings(
  providerId: number,
  data: Partial<typeof providers.$inferInsert>
) {
  return db
    .update(providers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(providers.id, providerId))
    .returning();
}

/** Update provider location */
export async function updateProviderLocation(
  providerId: number,
  data: Partial<typeof providerLocations.$inferInsert>
) {
  const existing = await db
    .select()
    .from(providerLocations)
    .where(eq(providerLocations.providerId, providerId))
    .limit(1);

  if (existing.length > 0) {
    return db
      .update(providerLocations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(providerLocations.providerId, providerId))
      .returning();
  } else {
    return db
      .insert(providerLocations)
      .values({ providerId, ...data } as typeof providerLocations.$inferInsert)
      .returning();
  }
}

/** Get opening hours for a provider by month */
export async function getProviderOpeningHours(providerId: number, year: number, month: number) {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  return db
    .select()
    .from(openingHours)
    .where(
      and(
        eq(openingHours.providerId, providerId),
        gte(openingHours.date, startDate),
        lte(openingHours.date, endDate)
      )
    )
    .orderBy(asc(openingHours.date));
}

/** Upsert opening hours for a provider */
export async function upsertOpeningHours(
  providerId: number,
  hours: { date: Date; openTime: string | null; closeTime: string | null; isClosed: boolean }[]
) {
  for (const h of hours) {
    const existing = await db
      .select()
      .from(openingHours)
      .where(and(eq(openingHours.providerId, providerId), eq(openingHours.date, h.date)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(openingHours)
        .set({ openTime: h.openTime, closeTime: h.closeTime, isClosed: h.isClosed })
        .where(eq(openingHours.id, existing[0].id));
    } else {
      await db.insert(openingHours).values({
        providerId,
        date: h.date,
        openTime: h.openTime,
        closeTime: h.closeTime,
        isClosed: h.isClosed,
      });
    }
  }
}

/** Confirm a booking */
export async function confirmBooking(bookingId: number, providerId: number) {
  return db
    .update(bookings)
    .set({ status: 'confirmed', confirmedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(bookings.id, bookingId), eq(bookings.providerId, providerId)))
    .returning();
}

/** Cancel a booking */
export async function cancelBooking(bookingId: number, providerId: number) {
  return db
    .update(bookings)
    .set({ status: 'cancelled', cancelledAt: new Date(), updatedAt: new Date() })
    .where(and(eq(bookings.id, bookingId), eq(bookings.providerId, providerId)))
    .returning();
}

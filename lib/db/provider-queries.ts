import { db } from './drizzle';
import {
  providers,
  providerLocations,
  bookingTypes,
  availabilitySlots,
  bookings,
  customerLeads,
  openingHours,
} from './schema';
import { eq, and, desc, gte, lte, sql, count, asc } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

/** Get the provider linked to the currently authenticated user */
export async function getProviderForUser() {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  // Primary: direct userId FK lookup (single query)
  const [byUserId] = await db
    .select()
    .from(providers)
    .where(eq(providers.userId, user.id))
    .limit(1);
  if (byUserId) return byUserId;

  // Fallback: legacy email match (kept until all providers have userId set)
  const [byEmail] = await db
    .select()
    .from(providers)
    .where(eq(providers.dashboardEmail, user.email))
    .limit(1);
  if (byEmail) return byEmail;

  return null;
}

/** Get provider with location */
export async function getProviderWithLocation(providerId: string) {
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
export async function getProviderStats(providerId: string) {
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

  // Today's opening hours — use date range to avoid timezone mismatch
  const [todayHours] = await db
    .select()
    .from(openingHours)
    .where(
      and(
        eq(openingHours.providerId, providerId),
        gte(openingHours.date, today),
        lte(openingHours.date, tomorrow)
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

  // Filled tables: count of distinct table numbers used today vs total capacity
  const todayBookingsWithTables = await db
    .select({ tableNumber: bookings.tableNumber })
    .from(bookings)
    .where(
      and(
        eq(bookings.providerId, providerId),
        gte(bookings.date, today),
        lte(bookings.date, tomorrow),
        sql`${bookings.tableNumber} IS NOT NULL`
      )
    );

  const uniqueTablesUsed = new Set(todayBookingsWithTables.map((b) => b.tableNumber)).size;
  const todayCapacityNum = Number(todayCapacityResult?.total || 0);

  const totalPlatform = platformStats.reduce((sum, p) => sum + Number(p.count), 0);

  return {
    todayCount: Number(todayCount?.count || 0),
    upcomingCount: Number(upcomingCount?.count || 0),
    totalBookings: Number(totalBookings?.count || 0),
    todayCapacity: todayCapacityNum,
    filledTables: todayCapacityNum > 0
      ? Math.round((uniqueTablesUsed / todayCapacityNum) * 100)
      : uniqueTablesUsed > 0 ? 100 : 0,
    filledTablesCount: uniqueTablesUsed,
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
export async function getTodayBookings(providerId: string) {
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
      tableNumber: bookings.tableNumber,
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
  providerId: string,
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

/** Get booking types for a provider (with today's availability) */
export async function getProviderBookingTypes(providerId: string) {
  const types = await db
    .select()
    .from(bookingTypes)
    .where(eq(bookingTypes.providerId, providerId))
    .orderBy(asc(bookingTypes.name));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Fetch today's availability slots for each booking type
  const typesWithAvailability = await Promise.all(
    types.map(async (bt) => {
      const slots = await db
        .select()
        .from(availabilitySlots)
        .where(
          and(
            eq(availabilitySlots.bookingTypeId, bt.id),
            gte(availabilitySlots.date, today),
            lte(availabilitySlots.date, tomorrow)
          )
        )
        .orderBy(asc(availabilitySlots.startTime))
        .limit(1);

      const slot = slots[0];
      return {
        ...bt,
        todayAvailability: slot
          ? `${slot.startTime} - ${slot.endTime}`
          : null,
      };
    })
  );

  return typesWithAvailability;
}

/** Update a booking type */
export async function updateBookingType(
  bookingTypeId: string,
  providerId: string,
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
  providerId: string,
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
  providerId: string,
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
export async function getProviderOpeningHours(providerId: string, year: number, month: number) {
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
  providerId: string,
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
export async function confirmBooking(bookingId: string, providerId: string) {
  return db
    .update(bookings)
    .set({ status: 'confirmed', confirmedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(bookings.id, bookingId), eq(bookings.providerId, providerId)))
    .returning();
}

/** Cancel a booking */
export async function cancelBooking(bookingId: string, providerId: string) {
  return db
    .update(bookings)
    .set({ status: 'cancelled', cancelledAt: new Date(), updatedAt: new Date() })
    .where(and(eq(bookings.id, bookingId), eq(bookings.providerId, providerId)))
    .returning();
}

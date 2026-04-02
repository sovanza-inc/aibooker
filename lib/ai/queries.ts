import { db } from '@/lib/db/drizzle';
import {
  providers,
  providerLocations,
  bookingTypes,
  availabilitySlots,
  bookings,
  customerLeads,
  integrations,
} from '@/lib/db/schema';
import { eq, and, gte, lte, ilike, sql, asc, or } from 'drizzle-orm';

/** Validate an AI API key — returns the integration if valid */
export async function validateApiKey(apiKey: string) {
  // Check master key for testing
  if (process.env.AI_MASTER_KEY && apiKey === process.env.AI_MASTER_KEY) {
    return { id: 0, source: 'master', teamId: 0 };
  }

  const [integration] = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.apiKey, apiKey), eq(integrations.status, 'active')))
    .limit(1);

  return integration || null;
}

/** Search providers by filters */
export async function searchProviders(filters: {
  city?: string;
  cuisine?: string;
  date?: string;
  time?: string;
  partySize?: number;
  query?: string;
  limit?: number;
  latitude?: number;
  longitude?: number;
}) {
  const conditions = [eq(providers.status, 'active')];

  // City filter
  if (filters.city) {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM provider_locations pl
        WHERE pl.provider_id = ${providers.id}
        AND LOWER(pl.city) = LOWER(${filters.city})
      )`
    );
  }

  // Cuisine filter — check if cuisineType JSON array contains the value
  if (filters.cuisine) {
    conditions.push(
      sql`${providers.cuisineType}::text ILIKE ${'%' + filters.cuisine + '%'}`
    );
  }

  // Free text query — search across all relevant fields
  if (filters.query) {
    const q = `%${filters.query}%`;
    conditions.push(
      or(
        ilike(providers.name, q),
        ilike(providers.description, q),
        sql`${providers.tags}::text ILIKE ${q}`,
        sql`${providers.cuisineType}::text ILIKE ${q}`,
        sql`${providers.bestFor}::text ILIKE ${q}`,
        sql`${providers.atmosphere}::text ILIKE ${q}`,
        ilike(providers.aboutCompany, q),
        ilike(providers.whatIsThisBusiness, q),
        ilike(providers.whatCanIBookHere, q),
        ilike(providers.whenShouldRecommend, q),
        ilike(providers.popularDishes, q),
        ilike(providers.whatMakesUnique, q),
      )!
    );
  }

  const hasGeo = filters.latitude != null && filters.longitude != null;

  const distanceExpr = hasGeo
    ? sql<number>`(6371 * acos(
        cos(radians(${filters.latitude})) * cos(radians(${providerLocations.latitude})) *
        cos(radians(${providerLocations.longitude}) - radians(${filters.longitude})) +
        sin(radians(${filters.latitude})) * sin(radians(${providerLocations.latitude}))
      ))`
    : null;

  const baseQuery = db
    .select({
      id: providers.id,
      name: providers.name,
      slug: providers.slug,
      description: providers.description,
      cuisineType: providers.cuisineType,
      tags: providers.tags,
      phone: providers.phone,
      email: providers.email,
      website: providers.website,
      priceRange: providers.priceRange,
      rating: providers.rating,
      // Location
      streetAddress: providerLocations.streetAddress,
      city: providerLocations.city,
      postalCode: providerLocations.postalCode,
      country: providerLocations.country,
      latitude: providerLocations.latitude,
      longitude: providerLocations.longitude,
      ...(distanceExpr ? { distance: distanceExpr } : {}),
    })
    .from(providers)
    .leftJoin(providerLocations, eq(providers.id, providerLocations.providerId))
    .where(and(...conditions))
    .limit(filters.limit || 10);

  const results = hasGeo && distanceExpr
    ? await baseQuery.orderBy(asc(distanceExpr))
    : await baseQuery;

  // If date/time/partySize provided, enrich with availability
  if (filters.date || filters.time || filters.partySize) {
    const enriched = [];
    for (const provider of results) {
      const availability = await getProviderAvailability(
        provider.id,
        filters.date,
        filters.time,
        filters.partySize
      );
      enriched.push({
        ...provider,
        availableSlots: availability.slots,
        hasAvailability: availability.slots.length > 0,
      });
    }
    return enriched;
  }

  return results.map(r => ({ ...r, availableSlots: [], hasAvailability: true }));
}

/** Get availability for a specific provider */
export async function getProviderAvailability(
  providerId: number,
  date?: string,
  time?: string,
  partySize?: number
) {
  const btList = await db
    .select()
    .from(bookingTypes)
    .where(and(eq(bookingTypes.providerId, providerId), eq(bookingTypes.isActive, true)));

  if (btList.length === 0) {
    return { slots: [], alternatives: [] };
  }

  const btIds = btList.map(bt => bt.id);
  const slotConditions = [
    sql`${availabilitySlots.bookingTypeId} IN (${sql.join(btIds.map(id => sql`${id}`), sql`, `)})`,
    gte(availabilitySlots.expiresAt, new Date()),
  ];

  if (date) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    slotConditions.push(gte(availabilitySlots.date, targetDate));
    slotConditions.push(lte(availabilitySlots.date, nextDay));
  }

  if (time) {
    // Find slots within 2 hours of requested time
    slotConditions.push(
      sql`${availabilitySlots.startTime} >= ${time}`
    );
  }

  if (partySize) {
    slotConditions.push(
      sql`(${availabilitySlots.maxPartySize} IS NULL OR ${availabilitySlots.maxPartySize} >= ${partySize})`
    );
  }

  const slots = await db
    .select({
      id: availabilitySlots.id,
      date: availabilitySlots.date,
      startTime: availabilitySlots.startTime,
      endTime: availabilitySlots.endTime,
      capacity: availabilitySlots.capacity,
      maxPartySize: availabilitySlots.maxPartySize,
      bookingTypeId: availabilitySlots.bookingTypeId,
      bookingTypeName: bookingTypes.name,
    })
    .from(availabilitySlots)
    .innerJoin(bookingTypes, eq(availabilitySlots.bookingTypeId, bookingTypes.id))
    .where(and(...slotConditions))
    .orderBy(asc(availabilitySlots.startTime))
    .limit(20);

  // Deduplicate slots by bookingTypeId + startTime
  const seen = new Set<string>();
  const uniqueSlots = slots.filter(slot => {
    const key = `${slot.bookingTypeId}-${slot.startTime}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Check which slots are already booked/held
  const availableSlots = [];
  for (const slot of uniqueSlots) {
    const [existing] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(
        and(
          eq(bookings.bookingTypeId, slot.bookingTypeId),
          eq(bookings.date, slot.date),
          eq(bookings.time, slot.startTime),
          sql`${bookings.status} IN ('confirmed', 'held', 'pending')`
        )
      );

    const bookedCount = Number(existing?.count || 0);
    if (bookedCount < slot.capacity) {
      availableSlots.push({
        ...slot,
        remainingCapacity: slot.capacity - bookedCount,
      });
    }
  }

  // Get alternative times if primary time not available
  let alternatives: string[] = [];
  if (time && availableSlots.length === 0 && date) {
    const altSlots = await db
      .select({ startTime: availabilitySlots.startTime })
      .from(availabilitySlots)
      .innerJoin(bookingTypes, eq(availabilitySlots.bookingTypeId, bookingTypes.id))
      .where(
        and(
          eq(bookingTypes.providerId, providerId),
          eq(bookingTypes.isActive, true),
          gte(availabilitySlots.date, new Date(date)),
          lte(availabilitySlots.date, new Date(new Date(date).getTime() + 86400000)),
          gte(availabilitySlots.expiresAt, new Date())
        )
      )
      .orderBy(asc(availabilitySlots.startTime))
      .limit(5);
    alternatives = altSlots.map(s => s.startTime);
  }

  return { slots: availableSlots, alternatives };
}

/** Create a booking with 300s hold */
export async function createBookingWithHold(data: {
  providerId: number;
  bookingTypeId: number;
  date: string;
  time: string;
  partySize: number;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  aiPlatform?: string;
  aiSessionId?: string;
  specialRequests?: string;
}) {
  // Upsert customer lead
  let [lead] = await db
    .select()
    .from(customerLeads)
    .where(eq(customerLeads.email, data.customer.email))
    .limit(1);

  if (!lead) {
    [lead] = await db
      .insert(customerLeads)
      .values({
        email: data.customer.email,
        phone: data.customer.phone || null,
        firstName: data.customer.firstName,
        lastName: data.customer.lastName,
      })
      .returning();
  }

  const bookingDate = new Date(data.date);
  bookingDate.setHours(0, 0, 0, 0);

  const now = new Date();
  const holdExpiresAt = new Date(now.getTime() + 300 * 1000); // 300 seconds

  const [booking] = await db
    .insert(bookings)
    .values({
      providerId: data.providerId,
      bookingTypeId: data.bookingTypeId,
      customerLeadId: lead.id,
      date: bookingDate,
      time: data.time,
      partySize: data.partySize,
      status: 'held',
      holdExpiresAt,
      heldAt: now,
      aiPlatform: data.aiPlatform || null,
      aiSessionId: data.aiSessionId || null,
      specialRequests: data.specialRequests || null,
    })
    .returning();

  return {
    bookingId: booking.id,
    status: booking.status,
    holdExpiresAt: holdExpiresAt.toISOString(),
    holdDurationSeconds: 300,
    customer: {
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
    },
  };
}

/** Get booking status */
export async function getBookingStatus(bookingId: number) {
  const [booking] = await db
    .select({
      id: bookings.id,
      status: bookings.status,
      date: bookings.date,
      time: bookings.time,
      partySize: bookings.partySize,
      holdExpiresAt: bookings.holdExpiresAt,
      aiPlatform: bookings.aiPlatform,
      externalBookingId: bookings.externalBookingId,
      createdAt: bookings.createdAt,
      confirmedAt: bookings.confirmedAt,
      cancelledAt: bookings.cancelledAt,
      providerName: providers.name,
      bookingTypeName: bookingTypes.name,
      customerFirstName: customerLeads.firstName,
      customerLastName: customerLeads.lastName,
      customerEmail: customerLeads.email,
    })
    .from(bookings)
    .innerJoin(providers, eq(bookings.providerId, providers.id))
    .innerJoin(bookingTypes, eq(bookings.bookingTypeId, bookingTypes.id))
    .innerJoin(customerLeads, eq(bookings.customerLeadId, customerLeads.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  return booking || null;
}

/** Expire all held bookings past their hold time */
export async function expireHeldBookings() {
  const now = new Date();
  const result = await db
    .update(bookings)
    .set({
      status: 'cancelled',
      cancelledAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(bookings.status, 'held'),
        lte(bookings.holdExpiresAt, now)
      )
    )
    .returning({ id: bookings.id });

  return result.length;
}

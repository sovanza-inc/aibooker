import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { providers, providerLocations, integrations, bookings, teams } from '@/lib/db/schema';
import { eq, count, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const rows = await db
      .select({
        id: providers.id,
        name: providers.name,
        status: providers.status,
        rating: providers.rating,
        createdAt: providers.createdAt,
        city: providerLocations.city,
        source: integrations.source,
        teamName: teams.name,
      })
      .from(providers)
      .leftJoin(providerLocations, eq(providerLocations.providerId, providers.id))
      .leftJoin(integrations, eq(providers.integrationId, integrations.id))
      .leftJoin(teams, eq(integrations.teamId, teams.id));

    // Get booking counts per provider
    const bookingCounts = await db
      .select({
        providerId: bookings.providerId,
        count: count(),
      })
      .from(bookings)
      .groupBy(bookings.providerId);

    const countMap = new Map(bookingCounts.map((r) => [r.providerId, r.count]));

    const result = rows.map((r) => ({
      id: r.id,
      name: r.name,
      city: r.city || '-',
      status: r.status,
      partner: r.teamName || r.source || '-',
      rating: r.rating,
      bookingsCount: countMap.get(r.id) || 0,
      createdAt: r.createdAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching admin providers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { providers, bookings, integrations } from '@/lib/db/schema';
import { count, eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const [providerCount] = await db
      .select({ value: count() })
      .from(providers);

    const [bookingCount] = await db
      .select({ value: count() })
      .from(bookings);

    const [integrationCount] = await db
      .select({ value: count() })
      .from(integrations)
      .where(eq(integrations.status, 'active'));

    const platformRows = await db
      .select({
        platform: bookings.aiPlatform,
        count: count(),
      })
      .from(bookings)
      .groupBy(bookings.aiPlatform);

    const totalB = platformRows.reduce((s, r) => s + r.count, 0);
    const platformStats = platformRows.map((r) => ({
      platform: r.platform || 'unknown',
      count: r.count,
      percentage: totalB > 0 ? Math.round((r.count / totalB) * 100) : 0,
    }));

    return NextResponse.json({
      totalProviders: providerCount.value,
      totalBookings: bookingCount.value,
      totalIntegrations: integrationCount.value,
      platformStats,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { bookings, providers, customerLeads, bookingTypes } from '@/lib/db/schema';
import { count, eq, sql, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const platform = searchParams.get('platform') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = 25;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (status) conditions.push(eq(bookings.status, status));
    if (platform) conditions.push(eq(bookings.aiPlatform, platform));

    const whereClause = conditions.length === 0
      ? undefined
      : conditions.length === 1
        ? conditions[0]
        : sql`${conditions[0]} AND ${conditions[1]}`;

    const rows = await db
      .select({
        id: bookings.id,
        date: bookings.date,
        time: bookings.time,
        partySize: bookings.partySize,
        status: bookings.status,
        aiPlatform: bookings.aiPlatform,
        providerName: providers.name,
        customerName: sql<string>`COALESCE(${customerLeads.firstName} || ' ' || ${customerLeads.lastName}, 'Unknown')`,
        customerEmail: customerLeads.email,
        bookingType: bookingTypes.name,
        createdAt: bookings.createdAt,
        specialRequests: bookings.specialRequests,
      })
      .from(bookings)
      .leftJoin(providers, eq(bookings.providerId, providers.id))
      .leftJoin(customerLeads, eq(bookings.customerLeadId, customerLeads.id))
      .leftJoin(bookingTypes, eq(bookings.bookingTypeId, bookingTypes.id))
      .where(whereClause)
      .orderBy(desc(bookings.createdAt))
      .limit(limit)
      .offset(offset);

    const [total] = await db
      .select({ value: count() })
      .from(bookings)
      .where(whereClause);

    return NextResponse.json({
      bookings: rows,
      total: total.value,
      page,
      totalPages: Math.ceil(total.value / limit),
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

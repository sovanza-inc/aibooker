import { NextRequest, NextResponse } from 'next/server';
import { getProviderForUser } from '@/lib/db/provider-queries';
import { db } from '@/lib/db/drizzle';
import { availabilitySlots, bookingTypes } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const provider = await getProviderForUser();
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const { id } = await params;
    const bookingTypeId = id;

    // Verify the booking type belongs to this provider
    const [bt] = await db
      .select()
      .from(bookingTypes)
      .where(and(eq(bookingTypes.id, bookingTypeId), eq(bookingTypes.providerId, provider.id)))
      .limit(1);

    if (!bt) {
      return NextResponse.json({ error: 'Booking type not found' }, { status: 404 });
    }

    // Get year from query params (default to current year)
    const url = new URL(request.url);
    const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()));

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const slots = await db
      .select({
        date: availabilitySlots.date,
        startTime: availabilitySlots.startTime,
        endTime: availabilitySlots.endTime,
        capacity: availabilitySlots.capacity,
      })
      .from(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.bookingTypeId, bookingTypeId),
          gte(availabilitySlots.date, startOfYear),
          lte(availabilitySlots.date, endOfYear)
        )
      );

    // Find the most common start/end times for the header
    const timeMap: Record<string, number> = {};
    for (const s of slots) {
      const key = `${s.startTime}-${s.endTime}`;
      timeMap[key] = (timeMap[key] || 0) + 1;
    }
    const mostCommon = Object.entries(timeMap).sort((a, b) => b[1] - a[1])[0];
    const [availableFrom, availableTo] = mostCommon ? mostCommon[0].split('-') : ['', ''];

    // Return dates as ISO strings for easy client-side comparison
    const availableDates = slots.map((s) => ({
      date: s.date.toISOString().split('T')[0],
      startTime: s.startTime,
      endTime: s.endTime,
    }));

    return NextResponse.json({
      availableFrom,
      availableTo,
      year,
      slots: availableDates,
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

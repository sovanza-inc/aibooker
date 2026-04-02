import { NextRequest, NextResponse } from 'next/server';
import { getProviderForUser, getProviderBookings, confirmBooking, cancelBooking } from '@/lib/db/provider-queries';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { z } from 'zod';

const actionSchema = z.object({
  bookingId: z.number().int().positive(),
  action: z.enum(['confirm', 'cancel']),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const provider = await getProviderForUser();
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const { searchParams } = request.nextUrl;
    const reservations = await getProviderBookings(provider.id, {
      status: searchParams.get('status') || undefined,
      platform: searchParams.get('platform') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const provider = await getProviderForUser();
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const raw = await request.json();
    const parsed = actionSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { bookingId, action } = parsed.data;

    let result;
    if (action === 'confirm') {
      result = await confirmBooking(bookingId, provider.id);
    } else {
      result = await cancelBooking(bookingId, provider.id);
    }

    return NextResponse.json(result[0] || { error: 'Booking not found' });
  } catch (error) {
    console.error('Error updating reservation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

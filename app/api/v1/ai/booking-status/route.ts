import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiKeyFromRequest, unauthorizedResponse } from '@/lib/ai/auth';
import { validateApiKey, getBookingStatus } from '@/lib/ai/queries';

const statusSchema = z.object({
  booking_id: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  try {
    const apiKey = getApiKeyFromRequest(request);
    if (!apiKey) return unauthorizedResponse();

    const integration = await validateApiKey(apiKey);
    if (!integration) return unauthorizedResponse('Invalid API key');

    const raw = await request.json();
    const parsed = statusSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const booking = await getBookingStatus(parsed.data.booking_id);

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({
      booking_id: booking.id,
      status: booking.status,
      provider: booking.providerName,
      booking_type: booking.bookingTypeName,
      date: booking.date,
      time: booking.time,
      party_size: booking.partySize,
      hold_expires_at: booking.holdExpiresAt,
      customer: {
        first_name: booking.customerFirstName,
        last_name: booking.customerLastName,
        email: booking.customerEmail,
      },
      external_booking_id: booking.externalBookingId,
      created_at: booking.createdAt,
      confirmed_at: booking.confirmedAt,
      cancelled_at: booking.cancelledAt,
    });
  } catch (error) {
    console.error('AI booking-status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

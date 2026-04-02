import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiKeyFromRequest, getAiPlatformFromRequest, unauthorizedResponse } from '@/lib/ai/auth';
import { validateApiKey, createBookingWithHold, getProviderAvailability } from '@/lib/ai/queries';

const bookSchema = z.object({
  provider_id: z.number().int().positive(),
  booking_type_id: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  party_size: z.number().int().min(1).max(50),
  customer: z.object({
    first_name: z.string().min(1).max(100),
    last_name: z.string().min(1).max(100),
    email: z.string().email(),
    phone: z.string().max(50).optional(),
  }),
  special_requests: z.string().max(1000).optional(),
  ai_session_id: z.string().max(255).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const apiKey = getApiKeyFromRequest(request);
    if (!apiKey) return unauthorizedResponse();

    const integration = await validateApiKey(apiKey);
    if (!integration) return unauthorizedResponse('Invalid API key');

    const raw = await request.json();
    const parsed = bookSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const data = parsed.data;
    const platform = getAiPlatformFromRequest(request);

    // Verify availability before booking
    const availability = await getProviderAvailability(
      data.provider_id,
      data.date,
      data.time,
      data.party_size
    );

    if (availability.slots.length === 0) {
      return NextResponse.json({
        error: 'No availability for the requested time and party size',
        alternative_times: availability.alternatives,
      }, { status: 409 });
    }

    // Create booking with 300s hold
    const result = await createBookingWithHold({
      providerId: data.provider_id,
      bookingTypeId: data.booking_type_id,
      date: data.date,
      time: data.time,
      partySize: data.party_size,
      customer: {
        firstName: data.customer.first_name,
        lastName: data.customer.last_name,
        email: data.customer.email,
        phone: data.customer.phone,
      },
      aiPlatform: platform || undefined,
      aiSessionId: data.ai_session_id,
      specialRequests: data.special_requests,
    });

    return NextResponse.json({
      booking_id: result.bookingId,
      status: result.status,
      hold_expires_at: result.holdExpiresAt,
      hold_duration_seconds: result.holdDurationSeconds,
      message: 'Booking held successfully. The slot is reserved for 5 minutes.',
      customer: result.customer,
    }, { status: 201 });
  } catch (error) {
    console.error('AI book error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

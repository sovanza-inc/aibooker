import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiKeyFromRequest, unauthorizedResponse } from '@/lib/ai/auth';
import { validateApiKey, getProviderAvailability } from '@/lib/ai/queries';

const availabilitySchema = z.object({
  provider_id: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM').optional(),
  party_size: z.number().int().min(1).max(50).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const apiKey = getApiKeyFromRequest(request);
    if (!apiKey) return unauthorizedResponse();

    const integration = await validateApiKey(apiKey);
    if (!integration) return unauthorizedResponse('Invalid API key');

    const raw = await request.json();
    const parsed = availabilitySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { provider_id, date, time, party_size } = parsed.data;

    const availability = await getProviderAvailability(provider_id, date, time, party_size);

    return NextResponse.json({
      provider_id,
      date,
      requested_time: time || null,
      requested_party_size: party_size || null,
      available: availability.slots.length > 0,
      slots: availability.slots.map((s: any) => ({
        time: s.startTime,
        end_time: s.endTime,
        booking_type_id: s.bookingTypeId,
        booking_type: s.bookingTypeName,
        remaining_capacity: s.remainingCapacity,
        max_party_size: s.maxPartySize,
      })),
      alternative_times: availability.alternatives,
      hold_possible: true,
      hold_duration_seconds: 300,
    });
  } catch (error) {
    console.error('AI availability error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

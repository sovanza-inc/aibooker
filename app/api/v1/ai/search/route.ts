import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getApiKeyFromRequest, getAiPlatformFromRequest, unauthorizedResponse } from '@/lib/ai/auth';
import { validateApiKey, searchProviders } from '@/lib/ai/queries';
import { checkRateLimit } from '@/lib/ai/rate-limit';

const searchSchema = z.object({
  city: z.string().max(255).optional(),
  cuisine: z.string().max(100).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM').optional(),
  party_size: z.number().int().min(1).max(50).optional(),
  query: z.string().max(500).optional(),
  limit: z.number().int().min(1).max(20).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Auth
    const apiKey = getApiKeyFromRequest(request);
    if (!apiKey) return unauthorizedResponse();

    const integration = await validateApiKey(apiKey);
    if (!integration) return unauthorizedResponse('Invalid API key');

    if (!checkRateLimit(apiKey, 100, 60000)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Parse body
    const raw = await request.json();
    const parsed = searchSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const platform = getAiPlatformFromRequest(request);
    const results = await searchProviders({
      city: parsed.data.city,
      cuisine: parsed.data.cuisine,
      date: parsed.data.date,
      time: parsed.data.time,
      partySize: parsed.data.party_size,
      query: parsed.data.query,
      limit: parsed.data.limit,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
    });

    return NextResponse.json({
      results: results.map((r: any) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        cuisine_type: r.cuisineType,
        tags: r.tags,
        price_range: r.priceRange,
        rating: r.rating,
        location: {
          street_address: r.streetAddress,
          city: r.city,
          postal_code: r.postalCode,
          country: r.country,
          latitude: r.latitude,
          longitude: r.longitude,
        },
        distance_km: (r as any).distance ?? null,
        has_availability: r.hasAvailability,
        available_slots: r.availableSlots.map((s: any) => ({
          time: s.startTime,
          end_time: s.endTime,
          booking_type: s.bookingTypeName,
          remaining_capacity: s.remainingCapacity,
        })),
        contact: {
          phone: r.phone,
          email: r.email,
          website: r.website,
        },
      })),
      count: results.length,
      platform,
    });
  } catch (error) {
    console.error('AI search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getProviderForUser, updateProviderSettings, updateProviderLocation } from '@/lib/db/provider-queries';
import { z } from 'zod';

const settingsSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  website: z.string().max(500).optional(),
  priceRange: z.number().min(1).max(4).optional(),
  minGuestSize: z.number().min(1).optional(),
  maxGuestSize: z.number().min(1).optional(),
  priceRangeFrom: z.number().min(0).optional(),
  priceRangeTo: z.number().min(0).optional(),
  aboutCompany: z.string().max(5000).optional(),
  whatIsThisBusiness: z.string().max(2000).optional(),
  whatCanIBookHere: z.string().max(2000).optional(),
  whenShouldRecommend: z.string().max(2000).optional(),
  whatCanCustomersBook: z.array(z.string()).optional(),
  bestFor: z.array(z.string()).optional(),
  atmosphere: z.array(z.string()).optional(),
  whatMakesUnique: z.string().max(1000).optional(),
  whenShouldChoose: z.string().max(1000).optional(),
  whenShouldNotChoose: z.string().max(1000).optional(),
  popularDishes: z.string().max(2000).optional(),
  targetAudience: z.array(z.string()).optional(),
  location: z.object({
    streetAddress: z.string().min(1).max(500),
    city: z.string().min(1).max(255),
    postalCode: z.string().min(1).max(20),
    country: z.string().max(10).default('NL'),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
}).strict();

export async function PUT(request: NextRequest) {
  try {
    const provider = await getProviderForUser();
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const raw = await request.json();
    const parsed = settingsSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { location, ...providerData } = parsed.data;

    const [updated] = await updateProviderSettings(provider.id, providerData);

    if (location) {
      await updateProviderLocation(provider.id, location);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

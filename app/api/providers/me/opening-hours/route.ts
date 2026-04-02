import { NextRequest, NextResponse } from 'next/server';
import { getProviderForUser, getProviderOpeningHours, upsertOpeningHours } from '@/lib/db/provider-queries';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { z } from 'zod';

const openingHoursSchema = z.object({
  hours: z.array(z.object({
    date: z.string(),
    openTime: z.string().nullable(),
    closeTime: z.string().nullable(),
    isClosed: z.boolean(),
  })).min(1).max(31),
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
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || new Date().getMonth().toString());

    const hours = await getProviderOpeningHours(provider.id, year, month);
    return NextResponse.json(hours);
  } catch (error) {
    console.error('Error fetching opening hours:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const provider = await getProviderForUser();
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const raw = await request.json();
    const parsed = openingHoursSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { hours } = parsed.data;

    await upsertOpeningHours(
      provider.id,
      hours.map((h) => ({
        date: new Date(h.date),
        openTime: h.openTime,
        closeTime: h.closeTime,
        isClosed: h.isClosed,
      }))
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating opening hours:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

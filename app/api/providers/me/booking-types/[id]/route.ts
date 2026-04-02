import { NextRequest, NextResponse } from 'next/server';
import { getProviderForUser, updateBookingType } from '@/lib/db/provider-queries';
import { z } from 'zod';

const bookingTypeSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  minPartySize: z.number().min(1).max(100).optional(),
  maxPartySize: z.number().min(1).max(100).optional(),
  duration: z.number().min(15).max(480).optional(),
  averagePricePerPerson: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
}).strict();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const provider = await getProviderForUser();
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const { id } = await params;
    const raw = await request.json();
    const parsed = bookingTypeSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const result = await updateBookingType(parseInt(id), provider.id, parsed.data);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Booking type not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating booking type:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

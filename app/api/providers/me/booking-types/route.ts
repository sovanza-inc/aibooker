import { NextResponse } from 'next/server';
import { getProviderForUser, getProviderBookingTypes } from '@/lib/db/provider-queries';

export async function GET() {
  try {
    const provider = await getProviderForUser();
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }
    const types = await getProviderBookingTypes(provider.id);
    return NextResponse.json(types);
  } catch (error) {
    console.error('Error fetching booking types:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getProviderForUser, getProviderWithLocation } from '@/lib/db/provider-queries';

export async function GET() {
  try {
    const provider = await getProviderForUser();
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }
    const full = await getProviderWithLocation(provider.id);
    return NextResponse.json(full);
  } catch (error) {
    console.error('Error fetching provider:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getProviderForUser, getProviderStats, getTodayBookings } from '@/lib/db/provider-queries';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const provider = await getProviderForUser();
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }
    const [stats, todayBookings] = await Promise.all([
      getProviderStats(provider.id),
      getTodayBookings(provider.id),
    ]);
    return NextResponse.json({ ...stats, todayBookings });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

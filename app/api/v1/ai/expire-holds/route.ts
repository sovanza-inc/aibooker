import { NextRequest, NextResponse } from 'next/server';
import { expireHeldBookings } from '@/lib/ai/queries';

/**
 * Expire held bookings that have passed their 300s hold time.
 * Can be called:
 * - Via cron job (e.g., every 30 seconds)
 * - Via Vercel cron
 * - Manually for testing
 *
 * Protected by a secret key to prevent abuse.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret or master key
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || process.env.AI_MASTER_KEY;

    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }

    const token = authHeader?.replace('Bearer ', '').trim();
    if (token !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const expired = await expireHeldBookings();

    return NextResponse.json({
      expired_count: expired,
      message: `${expired} held booking(s) expired`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Expire holds error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Also support GET for Vercel cron
export async function GET(request: NextRequest) {
  return POST(request);
}

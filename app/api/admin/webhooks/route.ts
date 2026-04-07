import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { webhookLogs } from '@/lib/db/schema';
import { count, eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = 25;
    const offset = (page - 1) * limit;

    const whereClause = status ? eq(webhookLogs.status, status) : undefined;

    const rows = await db
      .select({
        id: webhookLogs.id,
        source: webhookLogs.source,
        eventType: webhookLogs.eventType,
        status: webhookLogs.status,
        errorMessage: webhookLogs.errorMessage,
        createdAt: webhookLogs.createdAt,
        processedAt: webhookLogs.processedAt,
      })
      .from(webhookLogs)
      .where(whereClause)
      .orderBy(desc(webhookLogs.createdAt))
      .limit(limit)
      .offset(offset);

    const [total] = await db
      .select({ value: count() })
      .from(webhookLogs)
      .where(whereClause);

    return NextResponse.json({
      logs: rows,
      total: total.value,
      page,
      totalPages: Math.ceil(total.value / limit),
    });
  } catch (error) {
    console.error('Error fetching webhook logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

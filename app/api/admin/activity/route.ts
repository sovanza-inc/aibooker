import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { activityLogs, users, teams } from '@/lib/db/schema';
import { count, eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = 25;
    const offset = (page - 1) * limit;

    const rows = await db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        timestamp: activityLogs.timestamp,
        ipAddress: activityLogs.ipAddress,
        userName: users.name,
        userEmail: users.email,
        teamName: teams.name,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .leftJoin(teams, eq(activityLogs.teamId, teams.id))
      .orderBy(desc(activityLogs.timestamp))
      .limit(limit)
      .offset(offset);

    const [total] = await db
      .select({ value: count() })
      .from(activityLogs);

    return NextResponse.json({
      logs: rows,
      total: total.value,
      page,
      totalPages: Math.ceil(total.value / limit),
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { teams, teamMembers, users, integrations } from '@/lib/db/schema';
import { count, eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const rows = await db
      .select({
        id: teams.id,
        name: teams.name,
        planName: teams.planName,
        subscriptionStatus: teams.subscriptionStatus,
        stripeCustomerId: teams.stripeCustomerId,
        memberCount: sql<number>`(SELECT COUNT(*) FROM team_members WHERE team_members.team_id = ${teams.id})`,
        integrationCount: sql<number>`(SELECT COUNT(*) FROM integrations WHERE integrations.team_id = ${teams.id})`,
        createdAt: teams.createdAt,
      })
      .from(teams)
      .orderBy(teams.createdAt);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

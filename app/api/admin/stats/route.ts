import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import {
  providers, bookings, integrations, users, teams, customerLeads,
  webhookLogs, activityLogs, providerLocations,
} from '@/lib/db/schema';
import { count, eq, sql, gte, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [providerCount] = await db.select({ value: count() }).from(providers);
    const [bookingCount] = await db.select({ value: count() }).from(bookings);
    const [integrationCount] = await db.select({ value: count() }).from(integrations).where(eq(integrations.status, 'active'));
    const [userCount] = await db.select({ value: count() }).from(users);
    const [teamCount] = await db.select({ value: count() }).from(teams);
    const [customerCount] = await db.select({ value: count() }).from(customerLeads);

    const [recentBookings] = await db
      .select({ value: count() })
      .from(bookings)
      .where(gte(bookings.createdAt, sevenDaysAgo));

    const [recentUsers] = await db
      .select({ value: count() })
      .from(users)
      .where(gte(users.createdAt, thirtyDaysAgo));

    const [failedWebhooks] = await db
      .select({ value: count() })
      .from(webhookLogs)
      .where(eq(webhookLogs.status, 'failed'));

    const [pendingIntegrations] = await db
      .select({ value: count() })
      .from(integrations)
      .where(eq(integrations.status, 'pending'));

    // Platform distribution
    const platformRows = await db
      .select({ platform: bookings.aiPlatform, count: count() })
      .from(bookings)
      .groupBy(bookings.aiPlatform);

    const totalB = platformRows.reduce((s, r) => s + r.count, 0);
    const platformStats = platformRows.map((r) => ({
      platform: r.platform || 'unknown',
      count: r.count,
      percentage: totalB > 0 ? Math.round((r.count / totalB) * 100) : 0,
    }));

    // Booking status distribution
    const statusRows = await db
      .select({ status: bookings.status, count: count() })
      .from(bookings)
      .groupBy(bookings.status);

    // Provider status distribution
    const providerStatusRows = await db
      .select({ status: providers.status, count: count() })
      .from(providers)
      .groupBy(providers.status);

    // User role distribution
    const roleRows = await db
      .select({ role: users.role, count: count() })
      .from(users)
      .groupBy(users.role);

    // Top providers by bookings
    const topProviders = await db
      .select({
        name: providers.name,
        city: providerLocations.city,
        status: providers.status,
        bookingsCount: sql<number>`COUNT(${bookings.id})`,
      })
      .from(providers)
      .leftJoin(bookings, eq(providers.id, bookings.providerId))
      .leftJoin(providerLocations, eq(providers.id, providerLocations.providerId))
      .groupBy(providers.id, providers.name, providers.status, providerLocations.city)
      .orderBy(sql`COUNT(${bookings.id}) DESC`)
      .limit(5);

    // Recent bookings list
    const recentBookingsList = await db
      .select({
        id: bookings.id,
        date: bookings.date,
        time: bookings.time,
        partySize: bookings.partySize,
        status: bookings.status,
        aiPlatform: bookings.aiPlatform,
        providerName: providers.name,
        customerName: sql<string>`COALESCE(${customerLeads.firstName} || ' ' || ${customerLeads.lastName}, 'Unknown')`,
        createdAt: bookings.createdAt,
      })
      .from(bookings)
      .leftJoin(providers, eq(bookings.providerId, providers.id))
      .leftJoin(customerLeads, eq(bookings.customerLeadId, customerLeads.id))
      .orderBy(desc(bookings.createdAt))
      .limit(5);

    // Recent signups
    const recentSignups = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        authProvider: users.authProvider,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(5);

    // Integration source distribution
    const integrationSources = await db
      .select({ source: integrations.source, count: count() })
      .from(integrations)
      .groupBy(integrations.source);

    return NextResponse.json({
      totalProviders: providerCount.value,
      totalBookings: bookingCount.value,
      totalIntegrations: integrationCount.value,
      totalUsers: userCount.value,
      totalTeams: teamCount.value,
      totalCustomers: customerCount.value,
      recentBookings7d: recentBookings.value,
      recentUsers30d: recentUsers.value,
      failedWebhooks: failedWebhooks.value,
      pendingIntegrations: pendingIntegrations.value,
      platformStats,
      bookingStatusStats: statusRows.map((r) => ({ status: r.status, count: r.count })),
      providerStatusStats: providerStatusRows.map((r) => ({ status: r.status, count: r.count })),
      userRoleStats: roleRows.map((r) => ({ role: r.role, count: r.count })),
      topProviders,
      recentBookingsList,
      recentSignups,
      integrationSources: integrationSources.map((r) => ({ source: r.source, count: r.count })),
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

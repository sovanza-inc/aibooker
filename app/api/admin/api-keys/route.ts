import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { integrations, providers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const rows = await db
      .select({
        id: integrations.id,
        source: integrations.source,
        apiKey: integrations.apiKey,
        status: integrations.status,
        createdAt: integrations.createdAt,
        providerName: providers.name,
      })
      .from(integrations)
      .leftJoin(providers, eq(providers.integrationId, integrations.id));

    const result = rows.map((r) => ({
      id: r.id,
      providerName: r.providerName || 'Unlinked',
      source: r.source,
      apiKey: r.apiKey,
      status: r.status,
      createdAt: r.createdAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching admin api-keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

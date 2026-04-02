import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db/drizzle';
import { integrations, providers, providerLocations, teamMembers } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the user's team
    const teamResult = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, user.id))
      .limit(1);

    if (teamResult.length === 0) {
      return NextResponse.json({ error: 'No team found for user' }, { status: 400 });
    }

    const teamId = teamResult[0].teamId;

    const body = await request.json();
    const {
      name,
      email,
      phone,
      website,
      description,
      streetAddress,
      city,
      postalCode,
      country,
      latitude,
      longitude,
    } = body;

    if (!name || !streetAddress || !city || !postalCode) {
      return NextResponse.json(
        { error: 'Name, street address, city, and postal code are required' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    const randomSuffix = crypto.randomBytes(3).toString('hex');
    const slug = `${baseSlug}-${randomSuffix}`;

    const apiKey = crypto.randomUUID();
    const webhookSecret = crypto.randomUUID();

    // Create integration
    const [integration] = await db
      .insert(integrations)
      .values({
        teamId,
        source: 'manual',
        externalId: slug,
        status: 'active',
        apiKey,
        webhookSecret,
        activatedAt: new Date(),
      })
      .returning();

    // Create provider
    const [provider] = await db
      .insert(providers)
      .values({
        integrationId: integration.id,
        name,
        slug,
        description: description || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        dashboardEmail: user.email,
        status: 'active',
      })
      .returning();

    // Create provider location
    await db.insert(providerLocations).values({
      providerId: provider.id,
      streetAddress,
      city,
      postalCode,
      country: country || 'NL',
      latitude: latitude ?? 0,
      longitude: longitude ?? 0,
    });

    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    console.error('Error during provider onboarding:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

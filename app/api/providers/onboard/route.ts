import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db/drizzle';
import { integrations, providers, providerLocations, teamMembers, users, teams } from '@/lib/db/schema';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get full user from DB
    const [user] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Find the user's team, create one if they don't have one (social login users)
    let teamResult = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, user.id))
      .limit(1);

    if (teamResult.length === 0) {
      // Create a team for social login users who don't have one
      const [newTeam] = await db.insert(teams).values({ name: `${user.email}'s Team` }).returning();
      await db.insert(teamMembers).values({ teamId: newTeam.id, userId: user.id, role: 'owner' });
      teamResult = [{ teamId: newTeam.id }];
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

    // Check if user already has a provider
    const existingByEmail = await db.select().from(providers).where(eq(providers.dashboardEmail, user.email)).limit(1);
    if (existingByEmail.length > 0) {
      return NextResponse.json(existingByEmail[0], { status: 200 });
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
      country: (country || 'NL').slice(0, 10),
      latitude: latitude ?? 0,
      longitude: longitude ?? 0,
    });

    return NextResponse.json(provider, { status: 201 });
  } catch (error: any) {
    console.error('Error during provider onboarding:', error);
    const message = error?.detail || error?.message || 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

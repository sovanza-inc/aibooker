import { db } from './drizzle';
import {
  users,
  teams,
  teamMembers,
  integrations,
  providers,
  providerLocations,
  bookingTypes,
  availabilitySlots,
  bookings,
  customerLeads,
  openingHours,
} from './schema';
import { hashPassword } from '@/lib/auth/session';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('Seeding AiBooker database...');

  // 1. Create admin user
  const passwordHash = await hashPassword('admin123');
  const [user] = await db
    .insert(users)
    .values({
      email: 'martijn@jimani.nl',
      name: 'Martijn van Eerden',
      passwordHash,
      role: 'admin',
      authProvider: 'credentials',
    })
    .onConflictDoNothing()
    .returning();

  const userId = user?.id;
  if (!userId) {
    console.log('User already exists, fetching...');
  }

  // 2. Create booking partner team (Jimani)
  const [team] = await db
    .insert(teams)
    .values({
      name: 'Jimani',
    })
    .onConflictDoNothing()
    .returning();

  const teamId = team?.id;
  if (userId && teamId) {
    await db.insert(teamMembers).values({
      teamId,
      userId,
      role: 'owner',
    }).onConflictDoNothing();
  }

  // 3. Create integration (Jimani → La Piazza Amsterdam)
  const [integration] = await db
    .insert(integrations)
    .values({
      teamId: teamId || 1,
      source: 'jimani',
      externalId: 'rest_8472',
      status: 'active',
      apiKey: 'ak_jimani_lapiazza_' + Date.now(),
      webhookSecret: 'whsec_' + Date.now(),
      credentials: { apiUrl: 'https://api.jimani.nl/v1' },
      activatedAt: new Date(),
    })
    .returning();

  console.log('Integration created:', integration.id);

  // 4. Create provider (La Piazza Amsterdam)
  const [provider] = await db
    .insert(providers)
    .values({
      integrationId: integration.id,
      name: 'La Piazza Amsterdam',
      slug: 'la-piazza-amsterdam',
      description: 'Authentic Italian restaurant in the heart of Amsterdam. Known for our handmade pasta, wood-fired pizza, and extensive Italian wine list.',
      cuisineType: ['italian', 'pizza', 'pasta'],
      tags: ['romantic', 'terrace', 'wine bar', 'group friendly'],
      phone: '+31201234567',
      email: 'info@lapiazza.nl',
      website: 'https://lapiazza.nl',
      priceRange: 3,
      rating: 4.6,
      status: 'active',
      dashboardEmail: 'martijn@jimani.nl',
      dashboardPasswordHash: passwordHash,
      // Business info
      aboutCompany: 'La Piazza is a family-owned Italian restaurant that has been serving authentic Italian cuisine since 2010. Our chef trained in Naples and brings the true taste of Italy to Amsterdam.',
      whatIsThisBusiness: 'An authentic Italian restaurant with terrace seating in Amsterdam De Pijp neighborhood.',
      whatCanIBookHere: 'Lunch and dinner reservations, private dining for groups up to 20, wine tasting events.',
      whenShouldRecommend: 'When someone is looking for Italian food in Amsterdam, a romantic dinner spot, or a nice terrace for lunch.',
      whatCanCustomersBook: ['Lunch', 'Dinner', 'Drinks', 'Private dining', 'Group reservations'],
      bestFor: ['Date night', 'Business dinner', 'Friends', 'Tourists'],
      atmosphere: ['Romantic', 'Casual', 'Traditional'],
      whatMakesUnique: 'Handmade pasta daily, wood-fired oven imported from Naples, rooftop terrace with canal views.',
      whenShouldChoose: 'When you want authentic Italian food in a romantic atmosphere with great service.',
      whenShouldNotChoose: 'If you are looking for quick fast food or very budget-friendly options.',
      popularDishes: 'Truffle pasta, Margherita pizza from the wood-fired oven, Tiramisu, Ossobuco',
      minGuestSize: 1,
      maxGuestSize: 20,
      priceRangeFrom: 25.0,
      priceRangeTo: 42.5,
      targetAudience: ['Adults', 'Couples', 'Families with children', 'Groups', 'Tourists'],
    })
    .returning();

  console.log('Provider created:', provider.id);

  // 5. Create location
  await db.insert(providerLocations).values({
    providerId: provider.id,
    streetAddress: 'Ceintuurbaan 120',
    city: 'Amsterdam',
    postalCode: '1072GD',
    country: 'NL',
    latitude: 52.3508,
    longitude: 4.8952,
  });

  // 6. Create booking types
  const [lunch] = await db
    .insert(bookingTypes)
    .values({
      providerId: provider.id,
      externalId: 'bt_lunch',
      name: 'Lunch',
      description: 'Enjoy our lunch menu with a selection of pasta, salads, and panini.',
      category: 'restaurant',
      minPartySize: 1,
      maxPartySize: 10,
      duration: 90,
      averagePricePerPerson: 25.0,
      isActive: true,
    })
    .returning();

  const [dinner] = await db
    .insert(bookingTypes)
    .values({
      providerId: provider.id,
      externalId: 'bt_dinner',
      name: 'Dinner',
      description: 'Full Italian dining experience with our evening menu, wine pairings available.',
      category: 'restaurant',
      minPartySize: 2,
      maxPartySize: 20,
      duration: 120,
      averagePricePerPerson: 42.5,
      isActive: true,
    })
    .returning();

  const [highTea] = await db
    .insert(bookingTypes)
    .values({
      providerId: provider.id,
      externalId: 'bt_hightea',
      name: 'High Tea',
      description: 'Italian-style high tea with prosecco, pastries, and savory bites.',
      category: 'restaurant',
      minPartySize: 2,
      maxPartySize: 8,
      duration: 120,
      averagePricePerPerson: 32.5,
      isActive: false,
    })
    .returning();

  console.log('Booking types created:', lunch.id, dinner.id, highTea.id);

  // 7. Create availability slots for the next 7 days
  const today = new Date();
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(0, 0, 0, 0);

    const dayOfWeek = date.getDay();
    // Skip Monday (1), Tuesday (2) for lunch
    if (dayOfWeek !== 1 && dayOfWeek !== 2) {
      // Lunch slots
      for (const time of ['12:00', '12:30', '13:00', '13:30', '14:00']) {
        await db.insert(availabilitySlots).values({
          bookingTypeId: lunch.id,
          date,
          startTime: time,
          endTime: `${parseInt(time) + 1}:${time.split(':')[1]}`,
          capacity: 4,
          maxPartySize: 10,
          lastSyncedAt: new Date(),
          expiresAt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
        }).onConflictDoNothing();
      }
    }

    // Dinner slots (every day)
    for (const time of ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00']) {
      await db.insert(availabilitySlots).values({
        bookingTypeId: dinner.id,
        date,
        startTime: time,
        endTime: `${parseInt(time) + 2}:${time.split(':')[1]}`,
        capacity: 6,
        maxPartySize: 20,
        lastSyncedAt: new Date(),
        expiresAt: new Date(date.getTime() + 24 * 60 * 60 * 1000),
      }).onConflictDoNothing();
    }
  }
  console.log('Availability slots created for 7 days');

  // 8. Create sample customer leads
  const leads = await db
    .insert(customerLeads)
    .values([
      { email: 'jan.devries@example.com', phone: '+31612345001', firstName: 'Jan', lastName: 'de Vries' },
      { email: 'sophie.jansen@example.com', phone: '+31612345002', firstName: 'Sophie', lastName: 'Jansen' },
      { email: 'pieter.vandenberg@example.com', phone: '+31612345003', firstName: 'Pieter', lastName: 'van den Berg' },
      { email: 'emma.bakker@example.com', phone: '+31612345004', firstName: 'Emma', lastName: 'Bakker' },
      { email: 'lucas.meijer@example.com', phone: '+31612345005', firstName: 'Lucas', lastName: 'Meijer' },
      { email: 'anna.visser@example.com', phone: '+31612345006', firstName: 'Anna', lastName: 'Visser' },
    ])
    .returning();

  // 9. Create sample bookings
  const bookingData = [
    { leadIdx: 0, time: '18:00', partySize: 4, status: 'confirmed', platform: 'openai', confirmedAt: new Date() },
    { leadIdx: 1, time: '19:30', partySize: 2, status: 'confirmed', platform: 'claude', confirmedAt: new Date() },
    { leadIdx: 2, time: '20:00', partySize: 6, status: 'pending', platform: 'openai', confirmedAt: null },
    { leadIdx: 3, time: '18:30', partySize: 3, status: 'confirmed', platform: 'gemini', confirmedAt: new Date() },
    { leadIdx: 4, time: '19:00', partySize: 2, status: 'cancelled', platform: 'openai', confirmedAt: null },
    { leadIdx: 5, time: '20:30', partySize: 4, status: 'pending', platform: 'claude', confirmedAt: null },
  ];

  for (const b of bookingData) {
    await db.insert(bookings).values({
      providerId: provider.id,
      bookingTypeId: dinner.id,
      customerLeadId: leads[b.leadIdx].id,
      date: today,
      time: b.time,
      partySize: b.partySize,
      status: b.status,
      aiPlatform: b.platform,
      externalBookingId: `jim_book_${100000 + b.leadIdx}`,
      confirmedAt: b.confirmedAt,
      cancelledAt: b.status === 'cancelled' ? new Date() : null,
    });
  }
  console.log('Sample bookings created');

  // 10. Create opening hours for March 2026 (matching Miro mockup)
  const year = 2026;
  const month = 2; // March (0-indexed)
  for (let day = 1; day <= 31; day++) {
    const date = new Date(year, month, day);
    if (date.getMonth() !== month) break; // Past end of month

    const dayOfWeek = date.getDay();
    const isClosed = dayOfWeek === 1 || dayOfWeek === 2 || dayOfWeek === 3; // Mon, Tue, Wed closed (first weeks)

    await db.insert(openingHours).values({
      providerId: provider.id,
      date,
      openTime: isClosed ? null : '08:00',
      closeTime: isClosed ? null : '21:30',
      isClosed,
    }).onConflictDoNothing();
  }
  console.log('Opening hours created');

  console.log('\n✅ Seed complete!');
  console.log('Login: martijn@jimani.nl / admin123');
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });

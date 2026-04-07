import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client, { schema });

async function main() {
  // 1. Find user
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, 'abdullahtariq4946125@gmail.com')).limit(1);
  console.log('USER:', user?.id, user?.email, user?.role);

  // 2. Find provider
  let provider = (await db.select().from(schema.providers).where(eq(schema.providers.dashboardEmail, 'abdullahtariq4946125@gmail.com')).limit(1))[0];

  if (!provider && user) {
    // Try via team
    const [tm] = await db.select().from(schema.teamMembers).where(eq(schema.teamMembers.userId, user.id)).limit(1);
    if (tm) {
      const [integ] = await db.select().from(schema.integrations).where(eq(schema.integrations.teamId, tm.teamId)).limit(1);
      if (integ) {
        [provider] = await db.select().from(schema.providers).where(eq(schema.providers.integrationId, integ.id)).limit(1);
      }
    }
  }

  if (!provider) {
    // Just get any provider
    const allP = await db.select().from(schema.providers);
    console.log('ALL PROVIDERS:', allP.map(p => ({ id: p.id, name: p.name, email: p.dashboardEmail })));
    if (allP.length > 0) {
      provider = allP[0];
      console.log('Using first provider:', provider.id, provider.name);
    } else {
      console.log('No providers found. Cannot seed.');
      await client.end();
      return;
    }
  }

  console.log('PROVIDER:', provider.id, provider.name);

  // 3. Get or create booking type
  let [bt] = await db.select().from(schema.bookingTypes).where(eq(schema.bookingTypes.providerId, provider.id)).limit(1);
  if (!bt) {
    [bt] = await db.insert(schema.bookingTypes).values({
      providerId: provider.id,
      externalId: `demo-dinner-${provider.id}`,
      name: 'Dinner',
      category: 'dinner',
      minPartySize: 1,
      maxPartySize: 10,
      duration: 90,
      averagePricePerPerson: 35,
      isActive: true,
    }).returning();
    console.log('Created booking type:', bt.id);
  }

  // 4. Create customer leads
  const customers = [
    { firstName: 'Annemiek', lastName: 'Jansen', email: 'annemiek@example.com', phone: '+31612345001' },
    { firstName: 'Peter', lastName: 'de Vries', email: 'peter@example.com', phone: '+31612345002' },
    { firstName: 'Linda', lastName: 'van Dijk', email: 'linda@example.com', phone: '+31612345003' },
    { firstName: 'Sven', lastName: 'Bakker', email: 'sven@example.com', phone: '+31612345004' },
    { firstName: 'Emma', lastName: 'Visser', email: 'emma@example.com', phone: '+31612345005' },
    { firstName: 'Tom', lastName: 'de Boer', email: 'tom@example.com', phone: '+31612345006' },
    { firstName: 'Sophie', lastName: 'Mulder', email: 'sophie@example.com', phone: '+31612345007' },
    { firstName: 'Jan', lastName: 'Hendriks', email: 'jan@example.com', phone: '+31612345008' },
  ];

  const leadIds: number[] = [];
  for (const c of customers) {
    const existing = await db.select().from(schema.customerLeads).where(eq(schema.customerLeads.email, c.email)).limit(1);
    if (existing.length > 0) {
      leadIds.push(existing[0].id);
    } else {
      const [lead] = await db.insert(schema.customerLeads).values(c).returning();
      leadIds.push(lead.id);
    }
  }
  console.log('Customer leads ready:', leadIds.length);

  // 5. Create today's bookings
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayBookings = [
    { time: '19:00', partySize: 4, tableNumber: 6, platform: 'openai', status: 'confirmed', leadIdx: 0 },
    { time: '19:30', partySize: 2, tableNumber: 35, platform: 'claude', status: 'confirmed', leadIdx: 1 },
    { time: '20:00', partySize: 6, tableNumber: 12, platform: 'openai', status: 'pending', leadIdx: 2 },
    { time: '20:30', partySize: 3, tableNumber: 2, platform: 'gemini', status: 'confirmed', leadIdx: 3 },
    { time: '18:30', partySize: 2, tableNumber: 8, platform: 'openai', status: 'confirmed', leadIdx: 4 },
    { time: '19:00', partySize: 5, tableNumber: 15, platform: 'claude', status: 'confirmed', leadIdx: 5 },
    { time: '20:00', partySize: 4, tableNumber: 22, platform: 'openai', status: 'confirmed', leadIdx: 6 },
    { time: '21:00', partySize: 2, tableNumber: 4, platform: 'openai', status: 'pending', leadIdx: 7 },
  ];

  // Create bookings for past 7 days too (for weekly chart)
  const allBookings: any[] = [];

  // Today's bookings
  for (const b of todayBookings) {
    allBookings.push({
      providerId: provider.id,
      bookingTypeId: bt.id,
      customerLeadId: leadIds[b.leadIdx],
      date: today,
      time: b.time,
      partySize: b.partySize,
      tableNumber: b.tableNumber,
      aiPlatform: b.platform,
      status: b.status,
      confirmedAt: b.status === 'confirmed' ? new Date() : null,
    });
  }

  // Past 6 days bookings (varying counts for a nice chart)
  const dailyCounts = [12, 18, 8, 22, 15, 10]; // Mon-Sat before today
  const platforms = ['openai', 'openai', 'claude', 'gemini', 'openai', 'claude'];

  for (let dayOffset = 6; dayOffset >= 1; dayOffset--) {
    const day = new Date(today);
    day.setDate(day.getDate() - dayOffset);
    const count = dailyCounts[6 - dayOffset];

    for (let i = 0; i < count; i++) {
      const hour = 17 + Math.floor(i / 8);
      const min = (i % 4) * 15;
      allBookings.push({
        providerId: provider.id,
        bookingTypeId: bt.id,
        customerLeadId: leadIds[i % leadIds.length],
        date: day,
        time: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
        partySize: 2 + (i % 5),
        tableNumber: (i % 20) + 1,
        aiPlatform: platforms[i % platforms.length],
        status: 'confirmed',
        confirmedAt: new Date(),
      });
    }
  }

  // Insert all bookings in batches of 20
  const batchSize = 20;
  let inserted = 0;
  for (let i = 0; i < allBookings.length; i += batchSize) {
    const batch = allBookings.slice(i, i + batchSize);
    await db.insert(schema.bookings).values(batch);
    inserted += batch.length;
    console.log(`Inserted ${inserted}/${allBookings.length} bookings...`);
  }
  console.log('Inserted bookings:', inserted);

  // 6. Set today's opening hours
  const existingHours = await db.select().from(schema.openingHours)
    .where(eq(schema.openingHours.providerId, provider.id))
    .limit(1);

  if (existingHours.length === 0) {
    // Set opening hours for today and next 7 days
    for (let d = 0; d < 7; d++) {
      const day = new Date(today);
      day.setDate(day.getDate() + d);
      await db.insert(schema.openingHours).values({
        providerId: provider.id,
        date: day,
        openTime: '17:00',
        closeTime: '23:00',
        isClosed: false,
      });
    }
    console.log('Set opening hours for 7 days');
  }

  // 7. Create availability slots for fill rate
  const existingSlots = await db.select().from(schema.availabilitySlots)
    .where(eq(schema.availabilitySlots.bookingTypeId, bt.id))
    .limit(1);

  if (existingSlots.length === 0) {
    for (let d = 0; d < 7; d++) {
      const day = new Date(today);
      day.setDate(day.getDate() + d);
      const expiresAt = new Date(day);
      expiresAt.setDate(expiresAt.getDate() + 30);
      await db.insert(schema.availabilitySlots).values({
        bookingTypeId: bt.id,
        date: day,
        startTime: '17:00',
        endTime: '23:00',
        capacity: 40,
        maxPartySize: 10,
        expiresAt,
      });
    }
    console.log('Created availability slots for 7 days');
  }

  console.log('\nDone! Dashboard should now show data.');
  console.log('- Today bookings:', todayBookings.length);
  console.log('- Weekly total:', allBookings.length);
  console.log('- Platform split: ~50% OpenAI, ~25% Claude, ~25% Gemini');

  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });

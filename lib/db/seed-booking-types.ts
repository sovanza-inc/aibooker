import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { providers, bookingTypes, availabilitySlots } from './schema';
import { eq, and } from 'drizzle-orm';

const c = postgres(process.env.POSTGRES_URL!);
const db = drizzle(c);

async function main() {
  // Look up provider by slug instead of hardcoded ID
  const [provider] = await db.select().from(providers).where(eq(providers.slug, 'la-piazza')).limit(1);
  if (!provider) { console.error('Provider "la-piazza" not found'); process.exit(1); }
  const providerId = provider.id;

  // Add Lunch (active)
  const [lunch] = await db.insert(bookingTypes).values({
    providerId,
    externalId: `demo-lunch-${providerId}`,
    name: 'Lunch',
    description: 'Midday meal reservations',
    category: 'restaurant',
    minPartySize: 1,
    maxPartySize: 8,
    duration: 60,
    averagePricePerPerson: 25,
    isActive: true,
  }).returning();
  console.log('Created Lunch:', lunch.id);

  // Add High Tea (inactive)
  const [tea] = await db.insert(bookingTypes).values({
    providerId,
    externalId: `demo-hightea-${providerId}`,
    name: 'High Tea',
    description: 'Enjoy an afternoon high tea',
    category: 'restaurant',
    minPartySize: 2,
    maxPartySize: 6,
    duration: 90,
    averagePricePerPerson: 30,
    isActive: false,
  }).returning();
  console.log('Created High Tea:', tea.id);

  // Update Dinner description
  await db.update(bookingTypes)
    .set({ description: 'Evening meal reservations' })
    .where(and(eq(bookingTypes.providerId, providerId), eq(bookingTypes.name, 'Dinner')));
  console.log('Updated Dinner description');

  // Add availability slots for Lunch and High Tea
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expires = new Date(today);
  expires.setDate(expires.getDate() + 30);

  await db.insert(availabilitySlots).values({
    bookingTypeId: lunch.id,
    date: today,
    startTime: '12:00',
    endTime: '15:30',
    capacity: 30,
    maxPartySize: 8,
    expiresAt: expires,
  });

  await db.insert(availabilitySlots).values({
    bookingTypeId: tea.id,
    date: today,
    startTime: '12:00',
    endTime: '15:30',
    capacity: 15,
    maxPartySize: 6,
    expiresAt: expires,
  });

  console.log('Done! Created Lunch + High Tea with availability.');
  await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });

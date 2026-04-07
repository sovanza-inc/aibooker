import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { providers, availabilitySlots, bookingTypes } from './schema';
import { eq } from 'drizzle-orm';

const c = postgres(process.env.POSTGRES_URL!);
const db = drizzle(c);

async function main() {
  // Look up provider by slug instead of hardcoded ID
  const [provider] = await db.select().from(providers).where(eq(providers.slug, 'la-piazza')).limit(1);
  if (!provider) { console.error('Provider "la-piazza" not found'); process.exit(1); }
  const providerId = provider.id;

  // Get all booking types for this provider
  const bts = await db.select().from(bookingTypes).where(eq(bookingTypes.providerId, providerId));
  console.log('Booking types:', bts.map(b => ({ id: b.id, name: b.name })));

  const year = 2026;

  for (const bt of bts) {
    const isLunch = bt.name.toLowerCase().includes('lunch');
    const isDinner = bt.name.toLowerCase().includes('dinner');
    const startTime = isLunch ? '12:00' : isDinner ? '17:00' : '12:00';
    const endTime = isLunch ? '15:30' : isDinner ? '23:00' : '15:30';

    // Generate slots for most weekdays across the year
    const slots: any[] = [];

    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat

        // Skip some Sundays and random days to make the calendar look natural
        if (dayOfWeek === 0 && Math.random() > 0.3) continue;
        // For High Tea, fewer days available
        if (!isLunch && !isDinner && Math.random() > 0.6) continue;

        const expiresAt = new Date(date);
        expiresAt.setDate(expiresAt.getDate() + 30);

        slots.push({
          bookingTypeId: bt.id,
          date,
          startTime,
          endTime,
          capacity: isLunch ? 30 : isDinner ? 40 : 15,
          maxPartySize: bt.maxPartySize,
          expiresAt,
        });
      }
    }

    // Insert in batches
    const batchSize = 50;
    let inserted = 0;
    for (let i = 0; i < slots.length; i += batchSize) {
      const batch = slots.slice(i, i + batchSize);
      try {
        await db.insert(availabilitySlots).values(batch);
      } catch {
        // Skip duplicates
      }
      inserted += batch.length;
    }
    console.log(`${bt.name}: inserted ${inserted} availability slots`);
  }

  console.log('Done!');
  await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });

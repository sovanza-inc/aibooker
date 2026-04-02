import { auth } from './auth-config';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Get authenticated user from next-auth session.
 * If the user signed in via OAuth and doesn't exist in DB yet, creates them.
 */
export async function getAuthenticatedUser() {
  try {
    const session = await auth();
    if (!session?.user?.email) return null;

    const email = session.user.email;

    // Look up user in DB
    let [user] = await db
      .select({ id: users.id, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // If not found, create (OAuth user who signed in for the first time)
    if (!user) {
      const provider = (session.user as any)?.provider || 'google';
      [user] = await db
        .insert(users)
        .values({
          email,
          name: session.user.name || null,
          image: session.user.image || null,
          role: 'provider',
          authProvider: provider,
          emailVerified: new Date(),
        })
        .onConflictDoNothing()
        .returning();

      // If onConflictDoNothing returned nothing, try fetching again
      if (!user) {
        [user] = await db
          .select({ id: users.id, email: users.email, role: users.role })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
      }
    }

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  } catch (e) {
    console.error('getAuthenticatedUser error:', e);
    return null;
  }
}

import { auth } from './auth-config';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getAuthenticatedUser() {
  try {
    const session = await auth();
    if (!session?.user?.email) return null;

    // Always look up by email — most reliable
    const [user] = await db
      .select({ id: users.id, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

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

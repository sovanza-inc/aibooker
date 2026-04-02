import { cookies } from 'next/headers';
import { verifyToken } from './session';

export async function getAuthenticatedUser() {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  try {
    const data = await verifyToken(session);
    if (new Date(data.expires) < new Date()) return null;
    return data.user;
  } catch {
    return null;
  }
}

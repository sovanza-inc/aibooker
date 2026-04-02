import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/lib/db/drizzle';
import { users, accounts as accountsTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { compare } from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  pages: {
    signIn: '/sign-in',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'provider';
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        session.user.image = token.image as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (!account || !user.email) return false;

      try {
        if (account.type === 'oauth') {
          const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, user.email))
            .limit(1);

          if (existingUser) {
            // Link account if not linked
            const [existing] = await db
              .select()
              .from(accountsTable)
              .where(
                and(
                  eq(accountsTable.provider, account.provider),
                  eq(accountsTable.providerAccountId, account.providerAccountId)
                )
              )
              .limit(1);

            if (!existing) {
              await db.insert(accountsTable).values({
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                accessToken: account.access_token || null,
                refreshToken: account.refresh_token || null,
                expiresAt: account.expires_at || null,
                tokenType: account.token_type || null,
                scope: account.scope || null,
                idToken: account.id_token || null,
              }).onConflictDoNothing();
            }

            if (!existingUser.image && user.image) {
              await db.update(users)
                .set({ image: user.image, authProvider: account.provider })
                .where(eq(users.id, existingUser.id));
            }

            user.id = String(existingUser.id);
            (user as any).role = existingUser.role;
          } else {
            // Create new user
            const [newUser] = await db
              .insert(users)
              .values({
                email: user.email,
                name: user.name || null,
                image: user.image || null,
                role: 'provider',
                authProvider: account.provider,
                authProviderId: account.providerAccountId,
                emailVerified: new Date(),
              })
              .returning();

            await db.insert(accountsTable).values({
              userId: newUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              accessToken: account.access_token || null,
              refreshToken: account.refresh_token || null,
              expiresAt: account.expires_at || null,
              tokenType: account.token_type || null,
              scope: account.scope || null,
              idToken: account.id_token || null,
            }).onConflictDoNothing();

            user.id = String(newUser.id);
            (user as any).role = 'provider';
          }
        }
      } catch (error) {
        console.error('OAuth signIn error:', error);
        // Still allow sign-in even if DB linking fails
      }

      return true;
    },
    async redirect({ url, baseUrl }) {
      // After sign-in, always go to /overview
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return `${baseUrl}/overview`;
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1);

        if (!user || !user.passwordHash) return null;

        const isValid = await compare(credentials.password as string, user.passwordHash);
        if (!isValid) return null;

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
});

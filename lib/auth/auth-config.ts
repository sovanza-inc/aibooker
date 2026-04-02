import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
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
          // Lazy import to avoid loading DB at module init
          const { db } = await import('@/lib/db/drizzle');
          const { users, accounts: accountsTable } = await import('@/lib/db/schema');
          const { eq, and } = await import('drizzle-orm');

          const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, user.email!))
            .limit(1);

          if (existingUser) {
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
            const [newUser] = await db
              .insert(users)
              .values({
                email: user.email!,
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
        console.error('OAuth signIn DB error:', error);
      }

      return true;
    },
    async redirect({ url, baseUrl }) {
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

        const { db } = await import('@/lib/db/drizzle');
        const { users } = await import('@/lib/db/schema');
        const { eq } = await import('drizzle-orm');
        const { compare } = await import('bcryptjs');

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

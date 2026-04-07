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
    async jwt({ token, user, account, profile, trigger }) {
      // On first sign-in, store user info in token
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      if (account) {
        token.provider = account.provider;
      }
      // Fetch role from DB on sign-in or when role is missing
      if (token.email && (user || !token.role)) {
        try {
          const { db } = await import('@/lib/db/drizzle');
          const { users } = await import('@/lib/db/schema');
          const { eq } = await import('drizzle-orm');
          const [dbUser] = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.email, token.email as string))
            .limit(1);
          if (dbUser) {
            token.role = dbUser.role;
          }
        } catch {
          // DB unavailable — keep existing role
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
        (session.user as any).provider = token.provider;
        (session.user as any).role = token.role;
      }
      return session;
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
        };
      },
    }),
  ],
});

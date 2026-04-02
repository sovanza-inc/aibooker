import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/lib/db/drizzle';
import { users, accounts as accountsTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { compare } from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: '/sign-in',
    newUser: '/onboarding',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'provider';
        token.image = user.image;
      }
      if (account) {
        token.provider = account.provider;
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
    async signIn({ user, account, profile }) {
      if (!account) return false;

      // For OAuth providers, link or create user
      if (account.type === 'oauth' && user.email) {
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);

        if (existingUser) {
          // Link account if not already linked
          const [existingAccount] = await db
            .select()
            .from(accountsTable)
            .where(
              and(
                eq(accountsTable.provider, account.provider),
                eq(accountsTable.providerAccountId, account.providerAccountId)
              )
            )
            .limit(1);

          if (!existingAccount) {
            await db.insert(accountsTable).values({
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              accessToken: account.access_token,
              refreshToken: account.refresh_token,
              expiresAt: account.expires_at,
              tokenType: account.token_type,
              scope: account.scope,
              idToken: account.id_token,
            });
          }

          // Update user image if not set
          if (!existingUser.image && user.image) {
            await db
              .update(users)
              .set({ image: user.image, authProvider: account.provider })
              .where(eq(users.id, existingUser.id));
          }

          // Pass the DB user id to the token
          user.id = String(existingUser.id);
          (user as any).role = existingUser.role;
          return true;
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

          // Create account link
          await db.insert(accountsTable).values({
            userId: newUser.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at,
            tokenType: account.token_type,
            scope: account.scope,
            idToken: account.id_token,
          });

          user.id = String(newUser.id);
          (user as any).role = newUser.role;
          return true;
        }
      }

      return true;
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

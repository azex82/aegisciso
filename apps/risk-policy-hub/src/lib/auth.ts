import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@aegisciso/db';
import { createHash } from 'crypto';
import { type SessionUser, type RoleName } from '@aegisciso/shared';

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        });

        if (!user || !user.isActive) return null;

        const passwordHash = hashPassword(credentials.password);
        if (user.passwordHash !== passwordHash) return null;

        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

        const permissions = user.role.permissions.map((rp) => rp.permission.name);
        return { id: user.id, email: user.email, name: user.name, role: user.role.name as RoleName, permissions };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as SessionUser).role;
        token.permissions = (user as SessionUser).permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as SessionUser).id = token.id as string;
        (session.user as SessionUser).role = token.role as RoleName;
        (session.user as SessionUser).permissions = token.permissions as string[];
      }
      return session;
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};

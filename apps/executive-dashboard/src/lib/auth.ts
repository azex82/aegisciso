import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@aegisciso/db';
import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { type SessionUser, type RoleName, getPermissionsForRole } from '@aegisciso/shared';

// Secure password hashing with bcrypt
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Support both bcrypt (new) and SHA256 (legacy) for migration
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
    return bcrypt.compare(password, hash);
  }
  // Legacy SHA256 check - will be migrated on next login
  const sha256Hash = createHash('sha256').update(password).digest('hex');
  return sha256Hash === hash;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        });

        if (!user || !user.isActive) {
          return null;
        }

        const isValidPassword = await verifyPassword(credentials.password, user.passwordHash);
        if (!isValidPassword) {
          return null;
        }

        // Migrate legacy SHA256 passwords to bcrypt on successful login
        if (!user.passwordHash.startsWith('$2a$') && !user.passwordHash.startsWith('$2b$')) {
          const newHash = await hashPassword(credentials.password);
          await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: newHash },
          });
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Log the login
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'LOGIN',
            resource: 'auth',
            details: { method: 'credentials' },
          },
        });

        const permissions = user.role.permissions.map((rp) => rp.permission.name);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role.name as RoleName,
          permissions,
        };
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
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};

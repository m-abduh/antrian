import { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        token: { label: 'Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        if (credentials.token) {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/me`, {
            headers: { Authorization: `Bearer ${credentials.token}` },
          });
          const data = await res.json();
          if (!data.success) return null;
          return {
            id: data.data.admin.id,
            name: data.data.admin.name,
            email: data.data.admin.email,
            role: data.data.admin.role,
            merchantId: data.data.admin.merchantId,
            accessToken: credentials.token,
          } as any;
        }
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: credentials.email, password: credentials.password }),
        });
        const data = await res.json();
        if (!data.success) return null;
        return {
          id: data.data.admin.id,
          name: data.data.admin.name,
          email: data.data.admin.email,
          role: data.data.admin.role,
          merchantId: data.data.admin.merchantId,
          accessToken: data.data.token,
        } as any;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any;
        token.id = u.id;
        token.merchantId = u.merchantId;
        token.role = u.role;
        token.accessToken = u.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as any).merchantId = token.merchantId as string;
      (session.user as any).role = token.role as string;
      (session as any).accessToken = token.accessToken as string;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
};

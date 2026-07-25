import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
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
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        const u = user as any;
        token.id = u.id;
        token.merchantId = u.merchantId;
        token.role = u.role;
        token.accessToken = u.accessToken;
      }
      if (account?.provider === 'google') {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: account.id_token }),
        });
        const data = await res.json();
        if (data.success) {
          token.id = data.data.admin.id;
          token.merchantId = data.data.admin.merchantId;
          token.role = data.data.admin.role;
          token.name = data.data.admin.name;
          token.email = data.data.admin.email;
          token.accessToken = data.data.token;
        }
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
});

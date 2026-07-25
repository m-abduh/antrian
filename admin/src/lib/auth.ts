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
        token: { label: 'Token', type: 'text' },
      },
      async authorize(credentials) {
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
        console.log('[auth] Google account:', { provider: account.provider, id_token: account.id_token ? 'present' : 'missing', type: account.type });
        if (account.id_token) {
          token.googleIdToken = account.id_token;
        }
      }
      return token;
    },
    async session({ session, token }) {
      console.log('[auth] Session token keys:', Object.keys(token));
      session.user.id = token.id as string;
      (session.user as any).merchantId = token.merchantId as string;
      (session.user as any).role = token.role as string;
      (session as any).accessToken = token.accessToken as string;
      (session as any).googleIdToken = token.googleIdToken as string | undefined;
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

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
    async signIn({ account }) {
      if (account?.provider === 'google' && account.id_token) {
        const acct = account as any;
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: account.id_token }),
          });
          const data = await res.json();
          if (data.success) {
            acct.adminToken = data.data.token;
            acct.adminId = data.data.admin.id;
            acct.adminMerchantId = data.data.admin.merchantId;
            acct.adminRole = data.data.admin.role;
          } else {
            acct.adminError = data.error;
          }
        } catch {
          acct.adminError = 'Gagal terhubung ke server';
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        const u = user as any;
        token.id = u.id;
        token.merchantId = u.merchantId;
        token.role = u.role;
        token.accessToken = u.accessToken;
      }
      if (account?.provider === 'google') {
        delete token.adminError;
        const acct = account as any;
        if (acct.adminToken) {
          token.accessToken = acct.adminToken;
          token.id = acct.adminId;
          token.merchantId = acct.adminMerchantId;
          token.role = acct.adminRole;
        }
        if (acct.adminError) {
          token.adminError = acct.adminError;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as any).merchantId = token.merchantId as string;
      (session.user as any).role = token.role as string;
      (session as any).accessToken = token.accessToken as string;
      (session as any).adminError = token.adminError as string | undefined;
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

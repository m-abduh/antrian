import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      merchantId: string;
      role: string;
    };
    accessToken: string;
  }
}

import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    merchantId: string;
    role: string;
  }

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

declare module 'next-auth/jwt' {
  interface JWT {
    merchantId: string;
    role: string;
    accessToken: string;
  }
}

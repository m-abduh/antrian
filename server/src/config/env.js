import dotenv from 'dotenv';
dotenv.config();

const DEFAULT_SECRETS = ['your-secret-key-min-16-chars'];

const required = ['MONGODB_URI', 'JWT_SECRET', 'API_URL'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 16) {
  throw new Error('JWT_SECRET must be at least 16 characters long');
}

if (process.env.NODE_ENV === 'production') {
  if (DEFAULT_SECRETS.includes(process.env.JWT_SECRET || '')) {
    console.warn('WARNING: Using default JWT_SECRET in production! Change it immediately.');
  }
  if (process.env.CORS_ORIGIN === '*') {
    console.warn('WARNING: CORS_ORIGIN is set to "*" in production! Restrict it to specific origins.');
  }
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || '',
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || '',
  VAPID_SUBJECT: process.env.VAPID_SUBJECT || 'mailto:admin@tunggu.id',
  API_URL: process.env.API_URL,
  ROOT_DOMAIN: process.env.ROOT_DOMAIN || '',
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT || '',
  MINIO_PORT: parseInt(process.env.MINIO_PORT || '9000', 10),
  MINIO_USE_SSL: process.env.MINIO_USE_SSL === 'true',
  MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY || '',
  MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY || '',
  MINIO_BUCKET: process.env.MINIO_BUCKET || 'tunggu',
  MINIO_PUBLIC_URL: process.env.MINIO_PUBLIC_URL || '',
};

export default env;

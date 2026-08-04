import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand, CreateBucketCommand } from '@aws-sdk/client-s3';
import env from '../config/env.js';
import logger from '../config/logger.js';

let client = null;
let bucketReady = false;

function getClient() {
  if (!env.MINIO_ENDPOINT) return null;
  if (client) return client;
  client = new S3Client({
    endpoint: {
      protocol: env.MINIO_USE_SSL ? 'https:' : 'http:',
      hostname: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT,
      path: '/',
    },
    region: 'us-east-1',
    credentials: {
      accessKeyId: env.MINIO_ACCESS_KEY,
      secretAccessKey: env.MINIO_SECRET_KEY,
    },
    forcePathStyle: true,
  });
  return client;
}

export async function ensureBucket() {
  const c = getClient();
  if (!c) return;
  if (bucketReady) return;
  try {
    await c.send(new HeadBucketCommand({ Bucket: env.MINIO_BUCKET }));
  } catch (err) {
    if (err.name === 'NotFound') {
      try {
        await c.send(new CreateBucketCommand({ Bucket: env.MINIO_BUCKET }));
        logger.info(`[S3] Bucket "${env.MINIO_BUCKET}" created`);
      } catch (e) {
        if (e.name !== 'BucketAlreadyOwnedByYou' && e.name !== 'BucketAlreadyExists') throw e;
      }
    }
  }
  bucketReady = true;
}

export async function putObject(key, body, contentType) {
  const c = getClient();
  if (!c) throw new Error('MinIO/S3 belum dikonfigurasi');
  await ensureBucket();
  await c.send(new PutObjectCommand({
    Bucket: env.MINIO_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: 'public, max-age=2592000, immutable',
  }));
  return key;
}

export async function getObject(key) {
  const c = getClient();
  if (!c) return null;
  const out = await c.send(new GetObjectCommand({ Bucket: env.MINIO_BUCKET, Key: key }));
  return {
    body: out.Body,
    contentType: out.ContentType || 'application/octet-stream',
    cacheControl: out.CacheControl || 'public, max-age=2592000, immutable',
  };
}

export async function deleteObject(key) {
  const c = getClient();
  if (!c) return;
  try {
    await c.send(new DeleteObjectCommand({ Bucket: env.MINIO_BUCKET, Key: key }));
  } catch (err) {
    logger.warn(`[S3] Failed to delete ${key}: ${err.message}`);
  }
}

// Hapus objek berdasarkan URL lengkap yang tersimpan di DB (mis. https://api.tunggu.id/uploads/xxx.png)
export async function deleteObjectFromUrl(url) {
  if (!url) return;
  const key = urlKeyFromUrl(url);
  if (!key) return;
  await deleteObject(key);
}

export function urlKeyFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const m = url.match(/\/uploads\/([^/?#]+)$/);
  return m ? m[1] : null;
}

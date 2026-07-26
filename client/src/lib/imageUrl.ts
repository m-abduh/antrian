const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

function baseUrl(): string {
  return API_URL.replace(/\/api\/?$/, '');
}

export function imageUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${baseUrl()}${path}`;
}

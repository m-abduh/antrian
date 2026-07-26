const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function imageUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_URL}${path}`;
}

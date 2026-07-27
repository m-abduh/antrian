import { headers } from 'next/headers';

export async function getMerchantSlugServer(): Promise<string> {
  const h = await headers();
  return h.get('x-merchant-slug') || '';
}

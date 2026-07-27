import { getMerchantSlugServer } from '@/lib/getMerchantSlugServer';
import { CartClient } from './client';

export default async function Page() {
  const slug = await getMerchantSlugServer();
  return <CartClient slug={slug} />;
}

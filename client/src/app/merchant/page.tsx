import { getMerchantSlugServer } from '@/lib/getMerchantSlugServer';
import { MerchantClient } from './client';

export default async function Page() {
  const slug = await getMerchantSlugServer();
  return <MerchantClient slug={slug} />;
}

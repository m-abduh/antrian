import { getMerchantSlugServer } from '@/lib/getMerchantSlugServer';
import { OrderClient } from './client';

export default async function Page() {
  const slug = await getMerchantSlugServer();
  return <OrderClient slug={slug} />;
}

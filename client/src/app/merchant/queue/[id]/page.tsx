import { getMerchantSlugServer } from '@/lib/getMerchantSlugServer';
import { QueueClient } from './client';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const [slug, { id }] = await Promise.all([getMerchantSlugServer(), params]);
  return <QueueClient key={id} slug={slug} queueId={id} />;
}

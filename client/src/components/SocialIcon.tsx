import {
  IconBrandInstagram, IconBrandTiktok, IconBrandYoutube, IconBrandFacebook,
  IconBrandWhatsapp, IconBrandTelegram, IconBrandX, IconBrandThreads,
} from '@tabler/icons-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: IconBrandInstagram,
  tiktok: IconBrandTiktok,
  youtube: IconBrandYoutube,
  facebook: IconBrandFacebook,
  whatsapp: IconBrandWhatsapp,
  telegram: IconBrandTelegram,
  x: IconBrandX,
  threads: IconBrandThreads,
};

interface SocialIconProps {
  platform: string;
  className?: string;
}

export function SocialIcon({ platform, className = 'w-4 h-4' }: SocialIconProps) {
  const Icon = iconMap[platform];
  if (!Icon) return null;
  return <Icon className={className} />;
}
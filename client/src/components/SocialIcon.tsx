import { IconBrandInstagram, IconBrandTiktok, IconBrandYoutube, IconBrandFacebook } from '@tabler/icons-react';

interface SocialIconProps {
  platform: string;
  className?: string;
}

export function SocialIcon({ platform, className = 'w-4 h-4' }: SocialIconProps) {
  switch (platform) {
    case 'instagram':
      return <IconBrandInstagram className={className} />;
    case 'tiktok':
      return <IconBrandTiktok className={className} />;
    case 'youtube':
      return <IconBrandYoutube className={className} />;
    case 'facebook':
      return <IconBrandFacebook className={className} />;
    default:
      return null;
  }
}
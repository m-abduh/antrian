import { IconBrandInstagram, IconBrandTiktok, IconBrandYoutube, IconBrandFacebook } from '@tabler/icons-react';

const platformColors: Record<string, string> = {
  instagram: '#E1306C',
  tiktok: '#000000',
  youtube: '#FF0000',
  facebook: '#1877F2',
};

const platformGradients: Record<string, string> = {
  instagram: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
};

interface SocialIconProps {
  platform: string;
  className?: string;
}

export function SocialIcon({ platform, className = 'w-4 h-4' }: SocialIconProps) {
  const Icon = {
    instagram: IconBrandInstagram,
    tiktok: IconBrandTiktok,
    youtube: IconBrandYoutube,
    facebook: IconBrandFacebook,
  }[platform];

  if (!Icon) return null;

  const color = platformColors[platform] || '#6B7280';
  const gradient = platformGradients[platform];

  if (gradient) {
    return (
      <span
        className={`inline-flex ${className}`}
        style={{ backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', backgroundImage: gradient }}
      >
        <Icon />
      </span>
    );
  }

  return <Icon className={className} style={{ color }} />;
}
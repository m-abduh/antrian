'use client';

import { useTheme } from '@/lib/theme';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { IconSun, IconMoon } from '@tabler/icons-react';

export function ThemeToggle() {
  const { setTheme, resolved } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-9 h-9" />;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className="rounded-xl"
    >
      {resolved === 'dark' ? <IconSun className="w-4 h-4" /> : <IconMoon className="w-4 h-4" />}
    </Button>
  );
}
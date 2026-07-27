'use client';

import { useTheme } from '@/lib/theme';
import { useEffect, useState } from 'react';
import { IconSun, IconMoon } from '@tabler/icons-react';

export function ThemeToggle() {
  const { setTheme, resolved } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-9 h-9" />;

  return (
    <button
      onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
      className="w-9 h-9 flex items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
      aria-label="Toggle theme"
    >
      {resolved === 'dark' ? <IconSun className="w-4 h-4" /> : <IconMoon className="w-4 h-4" />}
    </button>
  );
}

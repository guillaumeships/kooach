'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const THEMES = [
  { value: 'light', label: 'Clair', icon: Sun },
  { value: 'system', label: 'Auto', icon: Monitor },
  { value: 'dark', label: 'Sombre', icon: Moon },
] as const;

/**
 * Toggle 3-state (light/system/dark) — pattern Linear/Vercel.
 * Affiche un placeholder avant montage côté client pour éviter le mismatch SSR.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={cn('h-9 w-[124px] rounded-md bg-muted', className)} />;
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-border bg-card p-0.5',
        className
      )}
      role="group"
      aria-label="Thème"
    >
      {THEMES.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={active}
            aria-label={label}
            className={cn(
              'relative inline-flex h-7 w-9 items-center justify-center rounded-full transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Variante compacte pour la sidebar / nav (un seul bouton qui cycle).
 */
export function ThemeToggleCompact({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={cn('h-9 w-9 rounded-md bg-muted', className)} />;
  }

  const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      aria-label={`Changer le thème (actuellement ${theme})`}
      className={className}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

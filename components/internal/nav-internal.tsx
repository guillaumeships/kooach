'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/internal/hooks', label: 'Hook Generator', icon: Sparkles },
  { href: '/internal/drafts', label: 'Drafts', icon: ListTodo },
] as const;

export function NavInternal() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3">
        <span
          className="text-sm font-semibold text-foreground"
          style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
        >
          Kooach · Founder Tools
        </span>
        <div className="flex items-center gap-1">
          {ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-card hover:text-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

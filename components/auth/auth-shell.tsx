import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background px-6 py-6 sm:py-10">
      <div className="kk-mesh-hero" aria-hidden />

      {/* Back link en haut à gauche, signature 2026 — pill rounded subtle */}
      <div className="relative z-10">
        <Link
          href="/"
          className="group inline-flex h-9 items-center gap-1.5 rounded-full border border-border/60 bg-card/70 px-3 text-[13px] font-medium text-muted-foreground backdrop-blur-sm transition-all hover:border-primary/30 hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Accueil
        </Link>
      </div>

      <div className="relative z-10 my-auto flex w-full justify-center pt-6">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="font-display mb-6 block text-center text-[22px] italic tracking-tight text-primary no-underline"
          >
            Kooach
          </Link>
          <Card className="shadow-kk-lg">
            <CardHeader className="text-center">
              <CardTitle className="font-display text-3xl font-bold tracking-tight">
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="mx-auto max-w-xs leading-relaxed">
                  {description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">{children}</CardContent>
          </Card>
          {footer && <div className="mt-5 text-center text-sm">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

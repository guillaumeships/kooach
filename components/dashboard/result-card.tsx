'use client';

import { motion } from 'framer-motion';
import { Check, Copy, Loader2, RefreshCw } from 'lucide-react';
import type { GenerationResult } from '@/types/database';
import type { CardDef, SingleContentKey } from '@/lib/cards-config';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { countWords, readingTime } from '@/lib/format';
import { cn } from '@/lib/utils';

export function CardSkeleton() {
  return (
    <Card className="kk-card-premium kk-noise overflow-hidden p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-3.5 w-32" />
        </div>
        <Skeleton className="h-7 w-16 rounded-md" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-[92%]" />
        <Skeleton className="h-3 w-[78%]" />
        <Skeleton className="h-3 w-[88%]" />
        <Skeleton className="h-3 w-[64%]" />
      </div>
    </Card>
  );
}

export function ResultCard({
  card,
  result,
  isRegening,
  copiedKey,
  anyBusy,
  onCopy,
  onRegen,
  index,
}: {
  card: CardDef;
  result: Partial<GenerationResult>;
  isRegening: boolean;
  copiedKey: string | null;
  anyBusy: boolean;
  onCopy: (key: string, text: string) => void;
  onRegen: (only: SingleContentKey) => void;
  index: number;
}) {
  if (isRegening) return <CardSkeleton />;

  const copyText = card.fields
    .map((f) => result[f] ?? '')
    .filter(Boolean)
    .join('\n\n');

  const isCopied = copiedKey === card.only;
  const charCount = copyText.length;
  const wordCount = countWords(copyText);
  const readMin = readingTime(wordCount);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="kk-card-premium kk-noise relative overflow-hidden p-5">
        {/* Header — icon + label en Fraunces serif */}
        <div className="relative mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base ring-1 ring-inset ring-black/5 dark:ring-white/5',
                card.iconBg,
              )}
            >
              {card.icon}
            </span>
            <span className="font-display text-[15px] font-bold tracking-tight text-foreground">
              {card.label}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onRegen(card.only)}
            disabled={anyBusy}
            className="border-border/60 bg-card/60 backdrop-blur-sm hover:border-primary/40 hover:text-primary"
          >
            {isRegening ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            Refaire
          </Button>
        </div>

        {/* Body */}
        <div className="relative">
          {card.fields.map((field, idx) => {
            const text = result[field];
            if (!text) return null;
            return (
              <div key={field}>
                {card.subLabels?.[field] && (
                  <p className="font-display mb-1.5 text-[12px] italic text-muted-foreground">
                    {card.subLabels[field]}
                  </p>
                )}
                <div className={cn('relative', idx < card.fields.length - 1 && 'mb-3')}>
                  <div className="relative max-h-[180px] overflow-hidden">
                    <p className="m-0 whitespace-pre-wrap break-words text-[14px] leading-relaxed text-foreground/90">
                      {text}
                    </p>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-card" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Separator className="my-3 opacity-60" />

        {/* Footer */}
        <div className="relative flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground tabular-nums">
            <span>{wordCount} mots</span>
            <span className="text-border">·</span>
            <span>{charCount} car.</span>
            {wordCount > 30 && (
              <>
                <span className="text-border">·</span>
                <span>~{readMin} min</span>
              </>
            )}
          </span>
          <Button
            variant={isCopied ? 'default' : 'secondary'}
            size="sm"
            onClick={() => onCopy(card.only, copyText)}
            className={cn(
              !isCopied && 'bg-primary-subtle/70 hover:bg-primary-subtle text-primary border-primary-muted/40',
            )}
          >
            {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {isCopied ? 'Copié' : 'Copier'}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

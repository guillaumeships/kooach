import { cn } from '@/lib/utils';

/**
 * Eyebrow stylé "✦ TITRE" en Fraunces serif primary — réutilisé partout
 * sur la landing pour annoncer une section. Cohérence avec /app et /history.
 */
export function SectionEyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        'font-display text-[14px] italic text-primary/80',
        className,
      )}
    >
      ✦ {children}
    </p>
  );
}

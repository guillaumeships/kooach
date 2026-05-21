import { HooksForm } from '@/components/internal/hooks-form';

/**
 * /internal/hooks — UI founder-only pour générer 3 hooks Insta calibrés
 * sur le style d'un coach (preview avant cold DM).
 *
 * Auth : gérée par /app/internal/layout.tsx (founder gate strict).
 *
 * UX :
 *   - Form : @handle + textarea posts (séparés par ligne vide)
 *   - Bouton "Générer 3 hooks"
 *   - Output : 3 cards avec line1 + line2 + bouton Copy
 *   - Régen possible (même handle/posts, temperature 0.85 = variabilité)
 */
export default function HooksPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <header className="mb-8">
          <p
            className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            ✦ Outil interne founder
          </p>
          <h1
            className="text-3xl font-bold text-foreground sm:text-4xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Hook Generator
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Colle 1-5 posts récents d'un coach Insta. L'IA sort 3 propositions de hook calibrées sur son style — pour drafter un cold DM Value-First en 5 sec.
          </p>
        </header>
        <HooksForm />
      </div>
    </main>
  );
}

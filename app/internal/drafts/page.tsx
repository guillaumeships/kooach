import { DraftsList } from '@/components/internal/drafts-list';

/**
 * /internal/drafts — UI founder-only listant l'historique des drafts de
 * cold DMs générés depuis /internal/hooks.
 *
 * Auth : gérée par app/internal/layout.tsx (founder gate strict).
 */
export default function DraftsPage() {
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
            Drafts cold DM
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Tous les hooks + posts complets générés. Reviens ici après les DMs pour marquer les status (envoyé / répondu / converti).
          </p>
        </header>
        <DraftsList />
      </div>
    </main>
  );
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kooach — En pause',
  description: 'Kooach est temporairement en pause. Le projet reviendra peut-être sous une autre forme.',
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-background text-foreground">
      <div className="max-w-xl text-center space-y-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-display italic">
          ✦ Kooach
        </p>

        <h1 className="text-4xl sm:text-5xl font-display italic leading-tight">
          On met sur pause.
        </h1>

        <div className="space-y-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
          <p>
            Kooach est en pause.
          </p>
        </div>
      </div>
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  BarChart3,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Repeat,
  Sparkles,
  TrendingUp,
  Trash2,
} from 'lucide-react';

import { AppPageHeader } from '@/components/dashboard/app-page-header';
import { BottomNav } from '@/components/dashboard/bottom-nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { HISTORY_LABELS } from '@/lib/cards-config';
import { useClipboard } from '@/hooks/use-clipboard';
import { authBody, RELOAD_KEY, TOKEN_KEY } from '@/lib/storage';
import { formatRelativeDate, snippet } from '@/lib/format';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { cn } from '@/lib/utils';

interface HistoryItem {
  id: string;
  created_at: string;
  post_emotionnel: string | null;
  post_educatif: string | null;
  post_motivationnel: string | null;
  bio_instagram: string | null;
  newsletter: string | null;
  email_relance: string | null;
  reel_idee: string | null;
  reel_script: string | null;
}

export default function HistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<HistoryItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { copiedKey, copy } = useClipboard();

  useEffect(() => {
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const t = localStorage.getItem(TOKEN_KEY);
        if (!user && !t) {
          router.push('/login');
          return;
        }
        const res = await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(authBody()),
        });
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Erreur de chargement');
        }
        const data = (await res.json()) as { items: HistoryItem[] };
        setItems(data.items);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const stats = (() => {
    if (!items) return { week: 0, month: 0, total: 0 };
    const now = Date.now();
    const week = items.filter(
      (i) => now - new Date(i.created_at).getTime() < 7 * 24 * 60 * 60 * 1000,
    ).length;
    const month = items.filter(
      (i) => now - new Date(i.created_at).getTime() < 30 * 24 * 60 * 60 * 1000,
    ).length;
    return { week, month, total: items.length };
  })();

  function handleReload(item: HistoryItem) {
    try {
      sessionStorage.setItem(
        RELOAD_KEY,
        JSON.stringify({
          post_emotionnel: item.post_emotionnel,
          post_educatif: item.post_educatif,
          post_motivationnel: item.post_motivationnel,
          bio_instagram: item.bio_instagram,
          newsletter: item.newsletter,
          email_relance: item.email_relance,
          reel_idee: item.reel_idee,
          reel_script: item.reel_script,
        }),
      );
    } catch {}
    router.push('/app');
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch('/api/history/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...authBody(), id }),
      });
      if (!res.ok) throw new Error('Erreur suppression');
      setItems((current) => (current ? current.filter((i) => i.id !== id) : current));
      setConfirmDelete(null);
      toast.success('Génération supprimée');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue';
      setError(msg);
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="kk-page-with-bottom-nav kk-noise min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-3xl">
        {/* Desktop : back nav + titre compact */}
        <AppPageHeader
          title="Historique"
          subtitle="Tes 30 dernières générations, toujours accessibles."
        />

        {/* Mobile : header complet (eyebrow + h1 large) */}
        <div className="mb-7 md:hidden">
          <p className="font-display mb-2 text-[14px] italic text-primary/80">
            ✦ Tes archives
          </p>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
            Historique
          </h1>
          <p className="mt-1.5 text-[14px] text-muted-foreground">
            Tes 30 dernières générations, toujours accessibles.
          </p>
        </div>

        {/* Stats compactes — strips horizontaux comme /app */}
        {!loading && items && (
          <div className="mb-6 grid grid-cols-3 gap-2">
            <StatStrip
              icon={Calendar}
              iconColor="bg-primary/15 text-primary"
              label="Cette semaine"
              value={stats.week}
              sub="dernières 7j"
            />
            <StatStrip
              icon={TrendingUp}
              iconColor="bg-violet-500/15 text-violet-600 dark:text-violet-400"
              label="Ce mois"
              value={stats.month}
              sub="dernières 30j"
            />
            <StatStrip
              icon={BarChart3}
              iconColor="bg-amber-500/15 text-amber-600 dark:text-amber-400"
              label="Total"
              value={stats.total}
              sub={stats.total > 1 ? 'générations' : 'génération'}
            />
          </div>
        )}

        {loading && (
          <p className="mt-16 text-center text-sm text-muted-foreground">Chargement…</p>
        )}
        {error && (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && items && items.length === 0 && (
          <Card className="kk-card-premium kk-noise mt-3 overflow-hidden px-6 py-12 text-center">
            <div className="relative mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-2xl" aria-hidden />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary-subtle text-primary">
                <Sparkles className="h-7 w-7" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="font-display mb-2 text-xl font-bold tracking-tight">
              Aucune génération pour le moment
            </h2>
            <p className="mx-auto mb-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Une fois que tu auras généré du contenu, tu retrouveras tout ici.
            </p>
            <Button onClick={() => router.push('/app')} leftIcon={Sparkles}>
              Aller au dashboard
            </Button>
          </Card>
        )}

        {/* Liste des rows */}
        {!loading && items && items.length > 0 && (
          <ul className="flex list-none flex-col gap-2.5 p-0">
            <AnimatePresence>
              {items.map((item, idx) => {
                const isOpen = openId === item.id;
                const preview =
                  item.post_emotionnel || item.post_educatif || item.post_motivationnel || '';

                // Compte le nombre de contenus dans cette génération (pour le badge)
                const contentCount = (
                  Object.keys(HISTORY_LABELS) as (keyof typeof HISTORY_LABELS)[]
                ).filter((k) => item[k]).length;

                return (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{
                      duration: 0.35,
                      delay: idx * 0.04,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <Card className="kk-card-premium kk-noise overflow-hidden">
                      <div className="flex items-center gap-3 px-5 py-4">
                        {/* Date pill à gauche */}
                        <div className="font-display shrink-0 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 text-center">
                          <div className="text-[10.5px] italic text-muted-foreground">
                            il y a
                          </div>
                          <div className="text-[13px] font-bold leading-tight text-foreground">
                            {formatRelativeDate(item.created_at).replace(/^Il y a /, '').replace(/^À l'instant$/, 'now')}
                          </div>
                        </div>

                        {/* Preview + badge count */}
                        <button
                          onClick={() => setOpenId(isOpen ? null : item.id)}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="mb-0.5 flex items-center gap-1.5">
                              <span className="font-display text-[12px] italic text-primary/85">
                                ✦ {contentCount} contenus
                              </span>
                            </div>
                            <p className="truncate text-[13px] text-muted-foreground">
                              {snippet(preview, 80)}
                            </p>
                          </div>
                          <span className="shrink-0 text-muted-foreground">
                            {isOpen ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </span>
                        </button>

                        {/* Actions compactes */}
                        <div className="flex shrink-0 gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReload(item)}
                            aria-label="Charger dans le dashboard"
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                          >
                            <Repeat className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setConfirmDelete(item)}
                            aria-label="Supprimer"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {isOpen && (
                        <CardContent className="flex flex-col gap-3 border-t border-border/60 p-5">
                          {(Object.keys(HISTORY_LABELS) as (keyof typeof HISTORY_LABELS)[]).map(
                            (key) => {
                              const text = item[key];
                              if (!text) return null;
                              const meta = HISTORY_LABELS[key];
                              const copyId = `${item.id}-${key}`;
                              return (
                                <div
                                  key={key}
                                  className="rounded-lg border border-border/60 bg-muted/30 p-3.5"
                                >
                                  <div className="mb-2 flex items-center justify-between">
                                    <span className="font-display text-[12.5px] font-bold tracking-tight text-foreground">
                                      {meta.icon} {meta.label}
                                    </span>
                                    <Button
                                      variant={copiedKey === copyId ? 'default' : 'secondary'}
                                      size="sm"
                                      onClick={() => copy(copyId, text)}
                                      className={cn(
                                        copiedKey !== copyId &&
                                          'bg-primary-subtle/70 text-primary border-primary-muted/40',
                                      )}
                                    >
                                      {copiedKey === copyId ? (
                                        <Check className="h-3 w-3" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                      {copiedKey === copyId ? 'Copié' : 'Copier'}
                                    </Button>
                                  </div>
                                  <pre className="m-0 whitespace-pre-wrap break-words font-sans text-[12.5px] leading-relaxed text-foreground/80">
                                    {text}
                                  </pre>
                                </div>
                              );
                            },
                          )}

                          {/* Action principale : charger dans dashboard, plus visible quand expand */}
                          <Button
                            variant="outline"
                            onClick={() => handleReload(item)}
                            leftIcon={Repeat}
                            className="self-start border-primary/30 text-primary hover:border-primary/60 hover:bg-primary-subtle/40"
                          >
                            Charger dans le dashboard
                          </Button>
                        </CardContent>
                      )}
                    </Card>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {/* Dialog confirmation suppression */}
      <Dialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette génération ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Les 7 contenus de cette génération seront
              définitivement perdus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              loading={deletingId === confirmDelete?.id}
              onClick={() => confirmDelete && handleDelete(confirmDelete.id)}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat strip — même pattern que /app StatsBar (cohérence visuelle)
// ─────────────────────────────────────────────────────────────────────────────

function StatStrip({
  icon: Icon,
  iconColor,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <div className="kk-card-premium kk-noise relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3">
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', iconColor)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-muted-foreground">
          {label}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-2xl font-bold leading-none tracking-tight text-foreground">
            {value === 0 ? '—' : value}
          </span>
          <span className="truncate text-[11px] text-muted-foreground">{sub}</span>
        </div>
      </div>
    </div>
  );
}

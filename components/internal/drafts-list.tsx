'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Copy, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type DraftStatus = 'draft' | 'sent' | 'replied' | 'converted' | 'archived';

interface Draft {
  id: string;
  prospect_handle: string;
  hook_line1: string;
  hook_line2: string;
  full_post: string;
  status: DraftStatus;
  response_text: string | null;
  notes: string | null;
  sent_at: string | null;
  replied_at: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_LABELS: Record<DraftStatus | 'all', string> = {
  all:       'Tous',
  draft:     'Drafts',
  sent:      'Envoyés',
  replied:   'Répondus',
  converted: 'Convertis',
  archived:  'Archivés',
};

const STATUS_COLORS: Record<DraftStatus, string> = {
  draft:     'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  sent:      'bg-sky-100 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200',
  replied:   'bg-violet-100 text-violet-900 dark:bg-violet-950/40 dark:text-violet-200',
  converted: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
  archived:  'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400',
};

export function DraftsList() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DraftStatus | 'all'>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === 'all'
        ? '/api/internal/drafts'
        : `/api/internal/drafts?status=${filter}`;
      const res = await fetch(url, { credentials: 'include' });
      const data = (await res.json()) as { ok: boolean; drafts?: Draft[] };
      if (data.ok && data.drafts) {
        setDrafts(data.drafts);
      }
    } catch (e) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void fetchDrafts();
  }, [fetchDrafts]);

  function toggleExpand(id: string) {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function updateStatus(id: string, status: DraftStatus) {
    try {
      const res = await fetch(`/api/internal/drafts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('failed');
      toast.success(`Status → ${STATUS_LABELS[status]}`);
      await fetchDrafts();
    } catch {
      toast.error('Update échoué');
    }
  }

  async function deleteDraft(id: string) {
    if (!confirm('Supprimer définitivement ce draft ?')) return;
    try {
      const res = await fetch(`/api/internal/drafts/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('failed');
      toast.success('Draft supprimé');
      await fetchDrafts();
    } catch {
      toast.error('Suppression échouée');
    }
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copié`);
    } catch {
      toast.error('Impossible de copier');
    }
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {(['all', 'draft', 'sent', 'replied', 'converted', 'archived'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition',
              filter === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:bg-background/50',
            )}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
          <span className="text-sm">Chargement…</span>
        </div>
      )}

      {/* Empty */}
      {!loading && drafts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {filter === 'all'
            ? 'Aucun draft pour le moment. Va sur Hook Generator pour en créer.'
            : `Aucun draft avec le status "${STATUS_LABELS[filter]}".`}
        </div>
      )}

      {/* Drafts list */}
      {!loading && drafts.map((d) => {
        const isOpen = expanded.has(d.id);
        return (
          <article
            key={d.id}
            className="rounded-2xl border border-border bg-card shadow-kk-sm"
          >
            {/* Header */}
            <header className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  @{d.prospect_handle}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatDate(d.created_at)}
                </p>
              </div>
              <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider', STATUS_COLORS[d.status])}>
                {STATUS_LABELS[d.status]}
              </span>
              <button
                type="button"
                onClick={() => toggleExpand(d.id)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-background/50 hover:text-foreground"
                aria-label={isOpen ? 'Réduire' : 'Développer'}
              >
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </header>

            {/* Hook preview (toujours visible) */}
            <div className="px-5 py-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Hook</p>
              <p className="text-[14px] font-semibold leading-snug text-foreground">{d.hook_line1}</p>
              <p className="text-[14px] leading-snug text-muted-foreground">{d.hook_line2}</p>
            </div>

            {/* Détails expand */}
            {isOpen && (
              <div className="space-y-4 border-t border-border/60 px-5 py-4">
                {/* Post complet */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Post complet ({d.full_post.length} chars)</p>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => copyText(`${d.hook_line1}\n${d.hook_line2}`, 'Hook')}
                        className="flex items-center gap-1 rounded-md border border-border bg-background/50 px-2 py-1 text-[11px] font-medium hover:bg-background"
                      >
                        <Copy className="h-3 w-3" />
                        Hook
                      </button>
                      <button
                        type="button"
                        onClick={() => copyText(d.full_post, 'Post')}
                        className="flex items-center gap-1 rounded-md border border-primary/40 bg-primary/5 px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/10"
                      >
                        <Copy className="h-3 w-3" />
                        Post
                      </button>
                    </div>
                  </div>
                  <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border/60 bg-background/40 p-3 font-sans text-[13px] leading-relaxed text-foreground">
                    {d.full_post}
                  </pre>
                </div>

                {/* Actions status */}
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Marquer comme</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(['draft', 'sent', 'replied', 'converted', 'archived'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => updateStatus(d.id, s)}
                        disabled={d.status === s}
                        className={cn(
                          'rounded-md px-2.5 py-1 text-[11px] font-medium transition',
                          d.status === s
                            ? cn('cursor-not-allowed opacity-60', STATUS_COLORS[s])
                            : 'border border-border bg-background/50 text-foreground hover:bg-background',
                        )}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delete */}
                <div className="flex justify-end border-t border-border/60 pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteDraft(d.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Supprimer
                  </Button>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

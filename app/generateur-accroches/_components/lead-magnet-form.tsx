'use client';

/**
 * Form lead magnet — capture email + génère 10 accroches Insta pour coachs sportifs.
 *
 * États : idle → loading (skeleton) → success (résultats inline)
 *                                   → rate-limited (carte upsell Kooach Pro)
 *                                   → idle + toast erreur (autres erreurs)
 * L'API /api/lead-magnet/generate accepte { niche, topic, goal, email }
 * et renvoie { hooks: { text: string; category: string }[] } ou 429 si limite IP.
 */

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Copy, Crown, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';

const NICHES = [
  { value: 'musculation',     label: 'Musculation / force' },
  { value: 'perte-poids',     label: 'Perte de poids' },
  { value: 'prepa-physique',  label: 'Prépa physique (course, cross, HIIT)' },
  { value: 'a-domicile',      label: 'Coaching à domicile' },
  { value: 'en-ligne',        label: 'Coaching en ligne' },
  { value: 'autre',           label: 'Autre / mixte' },
] as const;

const GOALS = [
  { value: 'dms',         label: 'Attirer des DMs' },
  { value: 'ventes',      label: 'Vendre mon programme' },
  { value: 'rdv',         label: 'Décrocher des RDV bilan' },
  { value: 'notoriete',   label: 'Booster ma notoriété' },
] as const;

type Hook = {
  text: string;
  category: string;
};

type FormState = {
  niche: string;
  topic: string;
  goal: string;
  email: string;
};

const INITIAL: FormState = { niche: '', topic: '', goal: '', email: '' };

export function LeadMagnetForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'rate-limited'>('idle');
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const isValid =
    form.niche !== '' &&
    form.topic.trim().length >= 3 &&
    form.goal !== '' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || status === 'loading') return;

    setStatus('loading');
    setHooks([]);

    try {
      const res = await fetch('/api/lead-magnet/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.status === 429) {
        // Rate limit atteint → bascule sur la card upsell Kooach Pro
        // (pas de toast pour ne pas redondance avec l'UI dédiée)
        setStatus('rate-limited');
        return;
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Une erreur est survenue. Réessaye dans 30 secondes.');
      }

      const data = (await res.json()) as { hooks: Hook[] };
      setHooks(data.hooks);
      setStatus('success');
      track('lead_magnet_accroches_generated', { niche: form.niche, goal: form.goal });
      toast.success('10 accroches générées !', {
        description: 'Tu les reçois aussi par email dans 1-2 minutes.',
      });
    } catch (err) {
      setStatus('idle');
      toast.error(err instanceof Error ? err.message : 'Erreur réseau, réessaye.');
    }
  }

  function copyHook(idx: number, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  }

  return (
    <div className="kk-card-premium kk-noise relative overflow-hidden rounded-2xl p-6 sm:p-8">
      {status === 'rate-limited' ? (
        <RateLimitUpsell />
      ) : (
      <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
        {/* Niche */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="lm-niche" className="text-[13px] font-medium text-foreground/85">
            Ta niche sportive
          </Label>
          <select
            id="lm-niche"
            value={form.niche}
            onChange={(e) => update('niche', e.target.value)}
            disabled={status === 'loading'}
            className="h-11 rounded-lg border border-border bg-background px-3 text-[14.5px] text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
            required
          >
            <option value="">Choisis…</option>
            {NICHES.map((n) => (
              <option key={n.value} value={n.value}>
                {n.label}
              </option>
            ))}
          </select>
        </div>

        {/* Goal */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="lm-goal" className="text-[13px] font-medium text-foreground/85">
            Ton objectif
          </Label>
          <select
            id="lm-goal"
            value={form.goal}
            onChange={(e) => update('goal', e.target.value)}
            disabled={status === 'loading'}
            className="h-11 rounded-lg border border-border bg-background px-3 text-[14.5px] text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
            required
          >
            <option value="">Choisis…</option>
            {GOALS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        {/* Topic */}
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="lm-topic" className="text-[13px] font-medium text-foreground/85">
            Sujet du post
          </Label>
          <Input
            id="lm-topic"
            type="text"
            placeholder="Ex : pourquoi 80% des gens stagnent en muscu après 6 mois"
            value={form.topic}
            onChange={(e) => update('topic', e.target.value)}
            disabled={status === 'loading'}
            maxLength={120}
            required
          />
          <span className="text-[11.5px] text-muted-foreground/70">
            {form.topic.length}/120 — sois précis pour des accroches calibrées
          </span>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="lm-email" className="text-[13px] font-medium text-foreground/85">
            Ton email
          </Label>
          <Input
            id="lm-email"
            type="email"
            placeholder="ton@email.com"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            disabled={status === 'loading'}
            required
          />
        </div>

        {/* CTA */}
        <div className="sm:col-span-2">
          <Button
            type="submit"
            block
            size="lg"
            disabled={!isValid || status === 'loading'}
            leftIcon={status === 'loading' ? Loader2 : Sparkles}
            className={cn(isValid && status === 'idle' && 'kk-glow-ready')}
          >
            {status === 'loading' ? 'Génération en cours…' : 'Générer mes 10 accroches'}
          </Button>
        </div>
      </form>
      )}

      {/* Résultats inline (visible aussi en rate-limited si on a déjà une génération) */}
      {(status === 'loading' || status === 'success' || (status === 'rate-limited' && hooks.length > 0)) && (
        <div className="mt-8 border-t border-border/60 pt-7">
          <div className="mb-5 flex items-center justify-between">
            <p className="font-display text-[14px] italic text-primary/80">
              ✦ Tes 10 accroches
            </p>
            {status === 'success' && (
              <span className="text-[12px] text-muted-foreground/80">
                💌 Aussi envoyé sur {form.email}
              </span>
            )}
          </div>

          {status === 'loading' && (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border/60 bg-card/40 p-4">
                  <Skeleton className="mb-2 h-3 w-20" />
                  <Skeleton className="mb-1.5 h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          )}

          {(status === 'success' || status === 'rate-limited') && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
              }}
              className="grid gap-3 sm:grid-cols-2"
            >
              {hooks.map((hook, i) => (
                <motion.div
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 8 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
                  }}
                  className="group rounded-xl border border-border/60 bg-card/60 p-4 transition-colors hover:border-primary/30"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-display text-[12.5px] italic text-primary/85">
                      ✦ {hook.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyHook(i, hook.text)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium transition-all',
                        copiedIdx === i
                          ? 'border-primary/40 bg-primary-subtle text-primary'
                          : 'border-border bg-background text-muted-foreground opacity-0 group-hover:opacity-100 hover:border-primary/30 hover:text-primary',
                      )}
                    >
                      {copiedIdx === i ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copiedIdx === i ? 'Copié' : 'Copier'}
                    </button>
                  </div>
                  <p className="text-[14px] leading-[1.55] text-foreground/90">{hook.text}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card upsell affichée quand l'utilisateur a atteint la limite gratuite (3/24h).
// On profite du friction point pour pousser Kooach Pro plutôt que juste dire
// "reviens demain".
// ─────────────────────────────────────────────────────────────────────────────

const PRO_BENEFITS = [
  'Génération illimitée (20 par jour)',
  '7 contenus complets, pas juste l’accroche',
  'Calibré sur ton ton, ta cible et ton objectif',
  'Bio Insta · newsletter · email relance · idée + script de réel',
] as const;

function RateLimitUpsell() {
  return (
    <div className="relative">
      {/* Halo glow primary derrière la card */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-6 h-40 rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />

      <div className="relative text-center">
        {/* Icon Crown avec halo */}
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-primary/15 blur-md" aria-hidden />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary-subtle text-primary shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.4)]">
            <Crown className="h-6 w-6" />
          </div>
        </div>

        <p className="font-display text-[14px] italic text-primary/80">
          ✦ Limite gratuite atteinte
        </p>

        <h3
          className="font-display mx-auto mt-2 max-w-md text-foreground"
          style={{ fontSize: 'clamp(22px, 3.4vw, 30px)', lineHeight: 1.15, letterSpacing: '-0.5px', fontWeight: 700 }}
        >
          Tu en veux plus que <em className="italic text-primary">10 accroches</em>&nbsp;?
        </h3>

        <p className="mx-auto mt-3 max-w-[460px] text-[14.5px] leading-[1.65] text-muted-foreground">
          Tu as utilisé tes 3 générations gratuites du jour. Avec{' '}
          <strong className="font-semibold text-foreground">Kooach Pro</strong>, tu génères{' '}
          <strong className="font-semibold text-foreground">7 contenus complets</strong> en 60s
          — pas juste des accroches.
        </p>

        {/* Benefits list */}
        <ul className="mx-auto mt-6 grid max-w-[480px] list-none gap-2.5 p-0 text-left">
          {PRO_BENEFITS.map((benefit, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[14px] text-foreground/90">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link
          href="/signup?utm_source=lead-magnet&utm_medium=rate-limit&utm_campaign=upsell"
          className="kk-glow-ready group relative mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-[15px] font-semibold text-primary-foreground shadow-[0_4px_16px_-2px_hsl(var(--primary)/0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-[0_8px_28px_-4px_hsl(var(--primary)/0.5)]"
        >
          Tester Kooach Pro · 7 jours gratuits
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>

        <p className="mt-4 text-[12.5px] text-muted-foreground/80">
          Annulable en 1 clic · ou reviens demain pour 3 générations gratuites
        </p>
      </div>
    </div>
  );
}

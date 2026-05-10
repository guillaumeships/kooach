'use client';

/**
 * Form lead magnet "générateur de bio Instagram coach sportif" — capture email
 * + génère 5 bios.
 *
 * États : idle → loading (skeleton) → success (résultats inline)
 * L'API /api/lead-magnet/generate-bio accepte { niche, specialty, city?, goal, email }
 * et renvoie { bios: { text: string; category: string }[] } ou 429 si limite IP.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Loader2, Sparkles } from 'lucide-react';
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
  { value: 'prepa-physique',  label: 'Prépa physique' },
  { value: 'a-domicile',      label: 'Coaching à domicile' },
  { value: 'en-ligne',        label: 'Coaching en ligne' },
  { value: 'femmes',          label: 'Coach femmes' },
  { value: 'transformation',  label: 'Transformation corps' },
  { value: 'autre',           label: 'Autre / mixte' },
] as const;

const GOALS = [
  { value: 'dms',         label: 'Recevoir des DMs' },
  { value: 'rdv',         label: 'Faire prendre RDV' },
  { value: 'lien-bio',    label: 'Cliquer sur le lien en bio' },
  { value: 'notoriete',   label: 'Travailler la notoriété' },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  autorite:        'Autorité / expertise',
  transformation:  'Résultat client',
  locale:          'Ancrage local',
  lifestyle:       'Style de vie',
  expertise:       'Spécialisation pointue',
};

type Bio = {
  text: string;
  category: string;
};

type FormState = {
  niche: string;
  specialty: string;
  city: string;
  goal: string;
  email: string;
};

const INITIAL: FormState = { niche: '', specialty: '', city: '', goal: '', email: '' };

export function BioForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [bios, setBios] = useState<Bio[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const isValid =
    form.niche !== '' &&
    form.specialty.trim().length >= 3 &&
    form.goal !== '' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || status === 'loading') return;

    setStatus('loading');
    setBios([]);

    try {
      const res = await fetch('/api/lead-magnet/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Une erreur est survenue. Réessaye dans 30 secondes.');
      }

      const data = (await res.json()) as { bios: Bio[] };
      setBios(data.bios);
      setStatus('success');
      track('lead_magnet_bio_generated', { niche: form.niche, goal: form.goal });
      toast.success('5 bios générées !', {
        description: 'Tu les reçois aussi par email dans 1-2 minutes.',
      });
    } catch (err) {
      setStatus('idle');
      toast.error(err instanceof Error ? err.message : 'Erreur réseau, réessaye.');
    }
  }

  function copyBio(idx: number, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  }

  return (
    <div className="kk-card-premium kk-noise relative overflow-hidden rounded-2xl p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
        {/* Niche */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="bio-niche" className="text-[13px] font-medium text-foreground/85">
            Ta niche sportive
          </Label>
          <select
            id="bio-niche"
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
          <Label htmlFor="bio-goal" className="text-[13px] font-medium text-foreground/85">
            Objectif de ta bio
          </Label>
          <select
            id="bio-goal"
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

        {/* Specialty */}
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="bio-specialty" className="text-[13px] font-medium text-foreground/85">
            Ta spécialité (ce qui te différencie)
          </Label>
          <Input
            id="bio-specialty"
            type="text"
            placeholder="Ex : transfo corps femmes 35+ ans, ou prépa physique foot 10 ans pros…"
            value={form.specialty}
            onChange={(e) => update('specialty', e.target.value)}
            disabled={status === 'loading'}
            maxLength={120}
            required
          />
          <span className="text-[11.5px] text-muted-foreground/70">
            {form.specialty.length}/120 — sois précis, c'est ce qui calibre la bio
          </span>
        </div>

        {/* City (optionnel) */}
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="bio-city" className="text-[13px] font-medium text-foreground/85">
            Ville / zone <span className="text-muted-foreground/70">(optionnel)</span>
          </Label>
          <Input
            id="bio-city"
            type="text"
            placeholder="Lyon · Paris · Toulouse · ou laisse vide si en ligne"
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
            disabled={status === 'loading'}
            maxLength={80}
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="bio-email" className="text-[13px] font-medium text-foreground/85">
            Ton email
          </Label>
          <Input
            id="bio-email"
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
            {status === 'loading' ? 'Génération en cours…' : 'Générer mes 5 bios'}
          </Button>
        </div>
      </form>

      {/* Résultats inline */}
      {(status === 'loading' || status === 'success') && (
        <div className="mt-8 border-t border-border/60 pt-7">
          <div className="mb-5 flex items-center justify-between">
            <p className="font-display text-[14px] italic text-primary/80">
              ✦ Tes 5 bios
            </p>
            {status === 'success' && (
              <span className="text-[12px] text-muted-foreground/80">
                💌 Aussi envoyé sur {form.email}
              </span>
            )}
          </div>

          {status === 'loading' && (
            <div className="grid gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border/60 bg-card/40 p-4">
                  <Skeleton className="mb-2 h-3 w-24" />
                  <Skeleton className="mb-1.5 h-4 w-full" />
                  <Skeleton className="mb-1.5 h-4 w-5/6" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          )}

          {status === 'success' && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden:  { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
              }}
              className="grid gap-3"
            >
              {bios.map((bio, i) => (
                <motion.div
                  key={i}
                  variants={{
                    hidden:  { opacity: 0, y: 8 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
                  }}
                  className="group rounded-xl border border-border/60 bg-card/60 p-4 transition-colors hover:border-primary/30"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-display text-[12.5px] italic text-primary/85">
                      ✦ {CATEGORY_LABELS[bio.category] ?? bio.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyBio(i, bio.text)}
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
                  <p className="whitespace-pre-line text-[14.5px] leading-[1.55] text-foreground/90">
                    {bio.text}
                  </p>
                  <p className="mt-2 text-[11px] text-muted-foreground/60">
                    {bio.text.length} caractères
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { Check, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { OBJECTIFS } from '@/lib/cards-config';
import { getVoiceCloningScore } from '@/lib/retention';
import { PROFILE_KEY } from '@/lib/storage';
import { cn } from '@/lib/utils';

interface ProfileFormProps {
  specialty: string;
  style: string;
  keywords: string;
  target: string;
  posts: string;
  objectif: string;
  setSpecialty: (v: string) => void;
  setStyle: (v: string) => void;
  setKeywords: (v: string) => void;
  setTarget: (v: string) => void;
  setPosts: (v: string) => void;
  setObjectif: (v: string) => void;
  errorMessage?: string;
  canGenerate: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
}

function CharCount({ current, max }: { current: number; max: number }) {
  const pct = current / max;
  const color =
    pct > 0.9 ? 'text-destructive' : pct > 0.75 ? 'text-warning' : 'text-muted-foreground/60';
  return (
    <span className={cn('text-[11px] tabular-nums', color)}>
      {current}/{max}
    </span>
  );
}

export function ProfileForm({
  specialty,
  style,
  keywords,
  target,
  posts,
  objectif,
  setSpecialty,
  setStyle,
  setKeywords,
  setTarget,
  setPosts,
  setObjectif,
  errorMessage,
  canGenerate,
  isGenerating,
  onGenerate,
}: ProfileFormProps) {
  const filledCount = [specialty, style, keywords, target].filter((v) => v.trim()).length;
  const filledPct = (filledCount / 4) * 100;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-5 pb-3 pt-4">
        {/* Progress profil */}
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="font-display m-0 text-[13px] italic text-muted-foreground">
              Ton profil
            </p>
            <span
              className={cn(
                'text-[11px] font-semibold tabular-nums',
                filledCount === 4 ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {filledCount}/4 rempli{filledCount > 1 ? 's' : ''}
            </span>
          </div>
          <Progress value={filledPct} />
        </div>

        <div className="flex flex-col gap-3">
          <Field
            label="Spécialité"
            value={specialty}
            max={300}
            input={
              <Textarea
                rows={2}
                maxLength={300}
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="ex : Coach sportif force & mobilité"
              />
            }
          />
          <Field
            label="Style & personnalité"
            value={style}
            max={500}
            input={
              <Textarea
                rows={2}
                maxLength={500}
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                placeholder="ex : Direct, bienveillant, sans bullshit"
              />
            }
          />
          <Field
            label="3 mots-clés"
            value={keywords}
            max={200}
            input={
              <Input
                maxLength={200}
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="ex : Énergie · Discipline · Résultats"
              />
            }
          />
          <Field
            label="Cible client"
            value={target}
            max={500}
            input={
              <Textarea
                rows={3}
                maxLength={500}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="ex : Femmes 30-45 ans qui veulent reprendre confiance"
              />
            }
          />

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label className="text-[12px] font-medium text-foreground/85">
                Tes anciens posts{' '}
                <span className="font-normal text-muted-foreground">
                  (optionnel mais recommandé)
                </span>
              </Label>
              <CharCount current={posts.length} max={2000} />
            </div>
            <Textarea
              rows={5}
              maxLength={2000}
              value={posts}
              onChange={(e) => setPosts(e.target.value)}
              placeholder="Colle 2-3 de tes anciens posts Instagram ici — Kooach adaptera son style au tien."
            />
            {posts.trim().length >= 30 ? (() => {
              const score = getVoiceCloningScore(posts.trim().length);
              return (
                <div className="mt-2">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1 text-[11.5px] font-medium text-primary">
                      <Check className="h-3 w-3" strokeWidth={2.5} /> Voice cloning actif
                    </div>
                    <span className="font-display text-[11.5px] font-bold tabular-nums text-primary">
                      {score}% match
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary-hover transition-all duration-500"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  {score < 80 && (
                    <p className="m-0 mt-1.5 text-[10.5px] leading-relaxed text-muted-foreground/80">
                      Plus tu colles d'exemples, plus Kooach te ressemble.
                    </p>
                  )}
                </div>
              );
            })() : (
              <p className="m-0 mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                💡 Sans tes posts, Kooach génère du bon contenu — mais avec tes exemples, il
                sonne vraiment comme toi.
              </p>
            )}
          </div>
        </div>

        {/* Objectif */}
        <div className="mt-4">
          <p className="m-0 mb-2 text-[13px] text-muted-foreground">
            Objectif <span className="text-muted-foreground/60">(optionnel)</span>
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {OBJECTIFS.map(({ value, icon }) => {
              const selected = objectif === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setObjectif(selected ? '' : value)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg border px-1.5 py-2 text-center text-[11px] leading-tight transition-all',
                    selected
                      ? 'border-primary bg-primary-subtle/60 font-medium text-primary'
                      : 'border-input bg-card text-muted-foreground hover:border-primary-muted hover:text-foreground'
                  )}
                >
                  <span className="text-base">{icon}</span>
                  {value}
                </button>
              );
            })}
          </div>
        </div>

        {errorMessage && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs leading-relaxed text-destructive">
            <span>⚠</span>
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Bouton générer fixe en bas */}
      <div className="border-t border-border/60 bg-gradient-to-t from-background/40 to-transparent px-5 py-4">
        <Button
          block
          size="lg"
          disabled={!canGenerate || isGenerating}
          onClick={onGenerate}
          leftIcon={isGenerating ? Loader2 : Sparkles}
          className={cn(canGenerate && !isGenerating && 'kk-glow-ready')}
        >
          {isGenerating ? 'Création en cours…' : 'Créer mon contenu'}
        </Button>
        {filledCount > 0 && !isGenerating && (
          <button
            type="button"
            onClick={() => {
              if (!confirm('Réinitialiser tout ton profil ? Cette action ne supprime pas tes générations passées.')) return;
              setSpecialty('');
              setStyle('');
              setKeywords('');
              setTarget('');
              setPosts('');
              setObjectif('');
              try {
                localStorage.removeItem(PROFILE_KEY);
              } catch {
                /* LS indispo */
              }
              toast.success('Profil réinitialisé');
            }}
            className="mx-auto mt-2.5 flex items-center gap-1.5 text-[11.5px] text-muted-foreground/70 transition-colors hover:text-destructive"
          >
            <RotateCcw className="h-3 w-3" />
            Réinitialiser le profil
          </button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  max,
  input,
}: {
  label: string;
  value: string;
  max: number;
  input: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <Label className="text-[12px] font-medium text-foreground/85">{label}</Label>
        <CharCount current={value.length} max={max} />
      </div>
      {input}
    </div>
  );
}

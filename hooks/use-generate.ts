'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { experimental_useObject as useObject } from '@ai-sdk/react';

import type { GenerationResult } from '@/types/database';
import type { GenerationStep } from '@/components/dashboard/generation-progress';
import type { SingleContentKey } from '@/lib/cards-config';
import { GenerationContentSchema } from '@/lib/generation-schema';
import { fireConfetti, getMilestone } from '@/lib/retention';
import { PROFILE_KEY, authBody } from '@/lib/storage';

type GenState = 'idle' | 'generating' | 'done' | 'error';

interface ProfilePayload {
  specialty: string;
  style: string;
  keywords: string;
  target: string;
  posts: string;
  objectif: string;
}

/**
 * Hook unique pour gérer la génération AI :
 *   - generate(profile)        → STREAMING via /api/generate/stream (useObject)
 *   - regenerate(only, profile) → fetch JSON classique vers /api/generate
 *
 * Pendant le stream, `result` se met à jour token par token (les ResultCards
 * voient leur texte s'écrire au fur et à mesure → perception 10× plus rapide).
 */
export function useGenerate(token: string) {
  const [genState, setGenState] = useState<GenState>('idle');
  const [genStep, setGenStep] = useState<GenerationStep>('preparing');
  const [errorMessage, setErrorMessage] = useState('');
  const [streamedResult, setStreamedResult] = useState<Partial<GenerationResult> | null>(null);
  const [regenKey, setRegenKey] = useState<string | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const profileRef = useRef<ProfilePayload | null>(null);

  // ── Streaming hook (génération complète) ─────────────────────────────────
  const {
    object,
    submit,
    isLoading,
    error: streamError,
    stop,
  } = useObject({
    api: '/api/generate/stream',
    schema: GenerationContentSchema,
    onFinish: ({ object: finalObject, error: finishError }) => {
      if (finishError) {
        setGenState('error');
        const msg = finishError instanceof Error
          ? finishError.message
          : 'Une erreur est survenue. Réessaie.';
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }
      if (!finalObject) {
        setGenState('error');
        setErrorMessage('Réponse incomplète du modèle. Réessaie.');
        toast.error('Réponse incomplète. Réessaie.');
        return;
      }

      // Sauvegarde profil localStorage
      const profile = profileRef.current;
      if (profile) {
        try {
          localStorage.setItem(
            PROFILE_KEY,
            JSON.stringify({
              specialty: profile.specialty,
              style: profile.style,
              keywords: profile.keywords,
              target: profile.target,
              posts: profile.posts,
            }),
          );
        } catch {
          /* localStorage indispo */
        }
      }

      // Refresh streak + total via /api/account (le serveur a updaté la DB)
      // → on déclenche les milestones celebrations sur le nouveau total.
      fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authBody()),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { streak_count?: number; total_generations?: number } | null) => {
          if (d?.streak_count !== undefined) setStreakCount(d.streak_count);

          // Milestone celebrations — confetti + toast spécial sur paliers clés
          if (typeof d?.total_generations === 'number') {
            const milestone = getMilestone(d.total_generations);
            if (milestone) {
              fireConfetti(milestone.bigConfetti ? 'big' : 'small');
              // Toast spécial après un petit délai pour laisser apparaître les cards
              setTimeout(() => {
                toast.success(`${milestone.emoji} ${milestone.title}`, {
                  description: milestone.description,
                  duration: 6000,
                });
              }, 800);
            }
          }
        })
        .catch(() => {});

      setGenStep('complete');
      setStreamedResult(finalObject as Partial<GenerationResult>);
      setTimeout(() => setGenState('done'), 400);
      toast.success('7 contenus générés ✨');
    },
  });

  // Pendant le stream, on suit `object` (partiel) qui se met à jour token par token
  useEffect(() => {
    if (isLoading && object) {
      setStreamedResult(object as Partial<GenerationResult>);
      // Détecte la transition preparing → generating dès qu'un champ apparaît
      if (genStep === 'preparing') setGenStep('generating');
    }
  }, [isLoading, object, genStep]);

  // Erreur réseau (différent de onFinish error)
  useEffect(() => {
    if (streamError) {
      setGenState('error');
      const msg = streamError.message || 'Erreur réseau. Vérifie ta connexion.';
      setErrorMessage(msg);
      toast.error(msg);
    }
  }, [streamError]);

  const isAnyBusy = isLoading || regenKey !== null;

  function generate(profile: ProfilePayload) {
    if (isAnyBusy) return;
    profileRef.current = profile;
    setGenState('generating');
    setGenStep('preparing');
    setErrorMessage('');
    setStreamedResult({}); // reset, mais affiche les cards au fur et à mesure

    submit({
      token,
      specialty: profile.specialty.trim(),
      style: profile.style.trim(),
      keywords: profile.keywords.trim(),
      target: profile.target.trim(),
      posts: profile.posts.trim() || undefined,
      objectif: profile.objectif || undefined,
    });
  }

  async function regenerate(only: SingleContentKey, profile: ProfilePayload) {
    if (isAnyBusy) return;
    setRegenKey(only);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          specialty: profile.specialty.trim(),
          style: profile.style.trim(),
          keywords: profile.keywords.trim(),
          target: profile.target.trim(),
          posts: profile.posts.trim() || undefined,
          objectif: profile.objectif || undefined,
          only,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as Partial<GenerationResult>;
        setStreamedResult((prev) => (prev ? { ...prev, ...data } : data));
      }
    } catch {
      /* échec silencieux */
    } finally {
      setRegenKey(null);
    }
  }

  return {
    genState,
    genStep,
    errorMessage,
    result: streamedResult,
    regenKey,
    streakCount,
    isAnyBusy,
    generate,
    regenerate,
    stopGenerate: stop,
    setResult: setStreamedResult,
    setGenState,
    setStreakCount,
  };
}

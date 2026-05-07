/**
 * lib/retention.ts
 *
 * Helpers pour les mécanismes de rétention in-app :
 *   - streak danger window (loss aversion)
 *   - voice cloning match score (investment escalation)
 *   - milestone celebrations (variable reward)
 *
 * Pattern Duolingo + Spotify Wrapped + Whoop adapté à un SaaS de
 * création de contenu coachs sportifs.
 */

import confetti from 'canvas-confetti';

// ─────────────────────────────────────────────────────────────────────────────
// Streak status
// ─────────────────────────────────────────────────────────────────────────────

export type StreakStatus =
  | { kind: 'none' }                         // pas de streak actif
  | { kind: 'safe'; hoursLeft: number }      // streak sûr (<18h depuis dernière gen)
  | { kind: 'warning'; hoursLeft: number; streak: number }  // 18-30h, prévenir
  | { kind: 'critical'; hoursLeft: number; streak: number } // 30-36h, urgent
  | { kind: 'broken'; daysSince: number };   // >3j sans gen, reprendre

const HOUR = 60 * 60 * 1000;

/**
 * Calcule le statut du streak en fonction du temps écoulé depuis la dernière
 * génération. Window : 36h pour conserver le streak (tolérance 1.5j).
 */
export function getStreakStatus(
  streakCount: number,
  lastGeneratedAt: string | null,
): StreakStatus {
  if (!lastGeneratedAt || streakCount <= 0) {
    if (lastGeneratedAt) {
      const daysSince = Math.floor(
        (Date.now() - new Date(lastGeneratedAt).getTime()) / (24 * HOUR),
      );
      if (daysSince >= 3) return { kind: 'broken', daysSince };
    }
    return { kind: 'none' };
  }

  const elapsed = Date.now() - new Date(lastGeneratedAt).getTime();
  const hoursElapsed = elapsed / HOUR;
  const hoursLeft = Math.max(0, 36 - hoursElapsed);

  if (hoursElapsed < 18) return { kind: 'safe', hoursLeft };
  if (hoursElapsed < 30) return { kind: 'warning', hoursLeft, streak: streakCount };
  if (hoursElapsed < 36) return { kind: 'critical', hoursLeft, streak: streakCount };
  // Au-delà de 36h, le streak est cassé côté serveur (next gen reset).
  // On affiche la version "broken" avec le nb de jours depuis last gen.
  const daysSince = Math.floor(elapsed / (24 * HOUR));
  return { kind: 'broken', daysSince };
}

// ─────────────────────────────────────────────────────────────────────────────
// Voice cloning match score
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Score de 0 à 100 basé sur la longueur des example_posts. Le voice cloning
 * Claude est plus précis avec plus d'exemples — ce score communique cette
 * réalité à l'utilisateur et l'incite à enrichir son profil (investment).
 *
 * Paliers calibrés sur l'expérience produit :
 *   0 chars      → 0%   (pas de cloning)
 *   30+ chars    → 35%  (warm-up, Kooach commence à voir)
 *   200+ chars   → 60%  (cloning fonctionnel)
 *   500+ chars   → 78%  (bon match)
 *   1000+ chars  → 88%  (très bon)
 *   2000+ chars  → 95%  (signature unique)
 */
export function getVoiceCloningScore(examplePostsLength: number): number {
  const len = examplePostsLength;
  if (len < 30) return 0;
  if (len < 200) return Math.round(35 + ((len - 30) / 170) * 25);   // 35→60
  if (len < 500) return Math.round(60 + ((len - 200) / 300) * 18);  // 60→78
  if (len < 1000) return Math.round(78 + ((len - 500) / 500) * 10); // 78→88
  if (len < 2000) return Math.round(88 + ((len - 1000) / 1000) * 7); // 88→95
  return 95;
}

// ─────────────────────────────────────────────────────────────────────────────
// Milestones celebrations
// ─────────────────────────────────────────────────────────────────────────────

export interface Milestone {
  reached: number;
  emoji: string;
  title: string;
  description: string;
  bigConfetti: boolean;
}

/**
 * Si la nouvelle gen atteint un palier, retourne le milestone à célébrer.
 * Sinon null.
 */
export function getMilestone(newTotal: number): Milestone | null {
  switch (newTotal) {
    case 1:
      return {
        reached: 1,
        emoji: '🎉',
        title: 'Première génération.',
        description: 'Bienvenue dans le club des coachs qui publient.',
        bigConfetti: true,
      };
    case 7:
      return {
        reached: 7,
        emoji: '🔥',
        title: '7 contenus créés.',
        description: "Une semaine d'avance.",
        bigConfetti: true,
      };
    case 30:
      return {
        reached: 30,
        emoji: '⚡',
        title: '30 contenus.',
        description: "Un mois d'autopilote.",
        bigConfetti: true,
      };
    case 100:
      return {
        reached: 100,
        emoji: '👑',
        title: '100 contenus.',
        description: 'Tu fais partie des power users Kooach.',
        bigConfetti: true,
      };
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Confetti orchestration
// ─────────────────────────────────────────────────────────────────────────────

const PRIMARY = '#2D6A4F';
const PRIMARY_LIGHT = '#52B788';
const ACCENT_AMBER = '#F59E0B';
const ACCENT_GOLD = '#FCD34D';

/**
 * Burst de confetti primary Kooach. Respecte prefers-reduced-motion.
 */
export function fireConfetti(intensity: 'small' | 'big' = 'small'): void {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const colors = [PRIMARY, PRIMARY_LIGHT, ACCENT_AMBER, ACCENT_GOLD];

  if (intensity === 'small') {
    confetti({
      particleCount: 60,
      spread: 65,
      origin: { y: 0.7 },
      colors,
      disableForReducedMotion: true,
    });
    return;
  }

  // Big : 2 bursts depuis les coins, façon victory
  const end = Date.now() + 600;
  const fire = () => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
      disableForReducedMotion: true,
    });
    if (Date.now() < end) requestAnimationFrame(fire);
  };
  fire();
}

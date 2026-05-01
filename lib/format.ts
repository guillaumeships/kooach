/** Format helpers — pas de logique métier, juste de l'affichage. */

export function formatTimeSaved(totalGens: number): string {
  const totalMinutes = totalGens * 30;
  if (totalMinutes < 60) return `${totalMinutes} min économisées`;
  const hours = Math.floor(totalMinutes / 60);
  if (hours < 100) return `${hours}h économisées`;
  const days = Math.floor(hours / 8);
  return `${days}j de travail économisés`;
}

export function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = diffMs / (1000 * 60 * 60);
  const diffD = diffH / 24;
  if (diffH < 1) return "À l'instant";
  if (diffH < 24) return `Il y a ${Math.floor(diffH)}h`;
  if (diffD < 7) return `Il y a ${Math.floor(diffD)}j`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function snippet(text: string | null, max = 90): string {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? clean.slice(0, max) + '…' : clean;
}

export function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function readingTime(words: number): number {
  return Math.max(1, Math.ceil(words / 230));
}

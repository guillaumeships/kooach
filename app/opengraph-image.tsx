/* eslint-disable react/no-unknown-property */
import { ImageResponse } from 'next/og';

// Open Graph image générée dynamiquement au build (next/og + ImageResponse).
// Convention Next.js App Router : ce fichier produit /opengraph-image au build.
// Apparaît automatiquement dans les previews Twitter/LinkedIn/iMessage/Slack etc.
//
// Format standard : 1200x630 (ratio 1.91:1) — recommandé par tous les
// réseaux sociaux. Si on l'augmente, la preview reste lisible mais alourdie.

// runtime 'edge' évite un bug Windows-only de fileURLToPath dans @vercel/og
// au build local. En prod Vercel (Linux), nodejs default marche aussi.
export const runtime = 'edge';

export const alt = 'Kooach — Ghost-writer IA pour coachs sportifs FR';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Charge un fichier de font depuis Google Fonts au build/runtime.
 * UA "MSIE 6.0" = Google retourne du ttf (compatible satori) au lieu de woff2.
 * Cache CDN sur la response → un seul fetch effectif par deploy.
 */
async function loadFraunces(weight: number, italic: boolean): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@${italic ? 1 : 0},${weight}&display=swap`,
    { headers: { 'User-Agent': 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)' } },
  ).then((res) => res.text());

  const url = css.match(/src:\s*url\((.+?)\)\s*format/)?.[1];
  if (!url) throw new Error('Fraunces URL introuvable dans le CSS Google Fonts');
  return fetch(url).then((res) => res.arrayBuffer());
}

export default async function OpenGraphImage() {
  // Charge les 2 variantes utilisées : bold + bold italic
  const [fraunces700, fraunces700italic] = await Promise.all([
    loadFraunces(700, false),
    loadFraunces(700, true),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px 90px',
          background:
            'linear-gradient(135deg, #FAFAF7 0%, #EBF5EF 50%, #FAFAF7 100%)',
          position: 'relative',
        }}
      >
        {/* Halo primary subtle (signature 2026) */}
        <div
          style={{
            position: 'absolute',
            top: '-200px',
            right: '-200px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(45, 106, 79, 0.18) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Wordmark — logo Kooach officiel (extrait de public/img/kooach-logo.svg) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
          <svg
            width="72"
            height="72"
            viewBox="0 0 72 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="72" height="72" rx="18" fill="#2D6A4F" />
            <path
              d="M36 18 L36 54 M22 28 L36 36 L22 44"
              stroke="#FAFAF7"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="48" cy="20" r="5.5" fill="#FAFAF7" />
          </svg>
          <div
            style={{
              fontSize: '52px',
              fontStyle: 'italic',
              color: '#2D6A4F',
              letterSpacing: '-1.5px',
              fontFamily: 'Fraunces',
              fontWeight: 600,
              lineHeight: 1,
            }}
          >
            Kooach
          </div>
        </div>

        {/* Headline conversationnel — typo serif italic comme la landing */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div
            style={{
              fontSize: '88px',
              fontWeight: 700,
              color: '#111827',
              lineHeight: 1.02,
              letterSpacing: '-3px',
              fontFamily: 'Fraunces',
            }}
          >
            Tu coaches.
          </div>
          <div
            style={{
              fontSize: '88px',
              fontWeight: 700,
              fontStyle: 'italic',
              color: '#2D6A4F',
              lineHeight: 1.02,
              letterSpacing: '-3px',
              fontFamily: 'Fraunces',
            }}
          >
            Kooach écrit pour toi.
          </div>
        </div>

        {/* Footer : pill niche à gauche, URL à droite — bien séparés pour respirer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '20px',
          }}
        >
          <div
            style={{
              background: '#2D6A4F',
              color: '#FAFAF7',
              padding: '12px 24px',
              borderRadius: '999px',
              fontSize: '24px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              letterSpacing: '-0.3px',
            }}
          >
            🏋️ Pour coachs sportifs FR · 7 contenus en 60s
          </div>

          <div
            style={{
              fontSize: '26px',
              color: '#2D6A4F',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              letterSpacing: '-0.5px',
            }}
          >
            kooach.fr <span style={{ display: 'flex' }}>→</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Fraunces', data: fraunces700, weight: 700, style: 'normal' },
        { name: 'Fraunces', data: fraunces700italic, weight: 700, style: 'italic' },
      ],
    },
  );
}

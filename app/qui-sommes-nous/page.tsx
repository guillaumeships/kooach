import type { Metadata } from 'next';
import Link from 'next/link';

import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';
import { LandingCTA } from '@/components/landing/landing-cta';
import { SectionEyebrow } from '@/components/landing/section-eyebrow';

export const metadata: Metadata = {
  title: 'Qui sommes-nous — Kooach',
  description:
    'Kooach, c\'est l\'histoire d\'un dev qui a vu ses copines coachs sportives galérer à écrire leurs posts Instagram. Construit en France, par un solo founder, sans levée de fonds.',
  alternates: { canonical: 'https://kooach.fr/qui-sommes-nous' },
};

export default function AboutPage() {
  return (
    <>
      <LandingNav />
      <main className="bg-background">
        <article className="mx-auto max-w-[680px] px-[6%] pb-24 pt-32">
          <SectionEyebrow className="mb-4">✦ Qui sommes-nous</SectionEyebrow>

          <h1 className="font-display mb-8 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
            Construit pour <em className="italic text-primary">une seule cible</em>. Pas pour plaire à tout le monde.
          </h1>

          <div className="space-y-6 text-[16px] leading-relaxed text-muted-foreground sm:text-[17px]">
            <p>
              <strong className="font-semibold text-foreground">Kooach</strong> est né d'un constat simple : les
              outils IA grand public (ChatGPT, Jasper, Copy.ai) génèrent du contenu plat,
              traduit littéralement de l'anglais, qui ne comprend ni le ton coach sportif FR,
              ni les codes Insta 2026, ni la psychologie d'un client qui veut perdre 10 kg.
            </p>

            <p>
              Pendant ce temps, un coach sportif perd <strong className="font-semibold text-foreground">4 à 6 heures
              par semaine</strong> à écrire ses posts Insta. À 50€/h de son temps facturable, c'est
              <strong className="font-semibold text-foreground"> 800€/mois en valeur perdue</strong>. Pour rien.
              Pour un truc qu'une IA bien calibrée peut faire en 60 secondes.
            </p>

            <h2 className="font-display !mt-12 !mb-4 text-2xl font-bold text-foreground">
              Une seule niche, traitée à fond
            </h2>

            <p>
              On a fait un choix qui paraît contre-intuitif : ne pas viser les "coachs en
              général" mais <strong className="font-semibold text-foreground">uniquement les coachs sportifs FR</strong> —
              en salle, à domicile, ou en ligne. Pas les coachs de vie, pas les coachs business,
              pas les coachs nutrition. <em>Encore.</em>
            </p>

            <p>
              Pourquoi ? Parce qu'un outil qui parle à tout le monde ne parle à personne. En se
              concentrant sur cette niche, on calibre Claude (le modèle IA d'Anthropic qu'on
              utilise) sur les hooks qui marchent en fitness, le ton qui convertit en DM, les
              angles qui vendent un programme musculation ou perte de poids. C'est ce qui fait
              la différence entre <em>"l'IA c'est nul, ça sonne faux"</em> et <em>"ah ouais,
              c'est exactement comme ça que je parle à mes clients"</em>.
            </p>

            <h2 className="font-display !mt-12 !mb-4 text-2xl font-bold text-foreground">
              Solo, en France, sans levée
            </h2>

            <p>
              Kooach est construit par <strong className="font-semibold text-foreground">Guillaume Thomas</strong>,
              auto-entrepreneur basé en France. Pas de fonds, pas d'équipe, pas de bureau dans
              le 9ème — juste un solo founder qui code, design et répond aux mails lui-même.
              Ça veut dire deux choses concrètes pour toi :
            </p>

            <ul className="!my-4 ml-5 list-disc space-y-2 text-muted-foreground">
              <li>
                <strong className="font-semibold text-foreground">Pas de pression d'investisseurs</strong> à scaler
                à tout prix. Si on a 100 clients qui paient 29€/mois, c'est suffisant pour vivre
                — et pour continuer à améliorer le produit pour eux.
              </li>
              <li>
                <strong className="font-semibold text-foreground">Tu écris à contact@kooach.fr, c'est moi qui
                réponds.</strong> Pas un support externalisé, pas un chatbot. Un humain qui
                connaît le produit en profondeur parce qu'il l'a fait.
              </li>
            </ul>

            <h2 className="font-display !mt-12 !mb-4 text-2xl font-bold text-foreground">
              RGPD, données en France
            </h2>

            <p>
              Tes profils, tes posts, ton style — tout est stocké sur Supabase (serveurs UE,
              RGPD). Aucune donnée n'est partagée avec des tiers. Aucun tracking publicitaire.
              Si tu supprimes ton compte, tout est effacé sous 30 jours. C'est dans les{' '}
              <Link
                href="/mentions-legales"
                className="text-primary underline-offset-2 hover:underline"
              >
                mentions légales
              </Link>{' '}
              et c'est respecté en pratique.
            </p>

            <h2 className="font-display !mt-12 !mb-4 text-2xl font-bold text-foreground">
              Notre philosophie
            </h2>

            <p>
              Tu coaches. Tu fais ton métier. Kooach écrit pour toi. C'est tout.
            </p>

            <p>
              Pas de pitch viral, pas de promesse "deviens millionnaire avec l'IA", pas de
              cours en ligne à 297€. Juste un outil qui te fait gagner du temps, calibré pour
              ta cible, à un prix qui ne casse pas ta marge.
            </p>
          </div>

          <div className="mt-16 flex flex-col items-center gap-3 rounded-2xl border border-border bg-card/50 p-8 text-center">
            <p className="text-[15px] text-muted-foreground">Prêt à voir ce que ça donne pour toi ?</p>
            <LandingCTA href="/signup" size="lg">
              Commencer mes 7 jours gratuits
            </LandingCTA>
            <p className="text-[12px] text-muted-foreground/80">
              Sans engagement. Annulable en 1 clic.
            </p>
          </div>
        </article>
      </main>
      <LandingFooter />
    </>
  );
}

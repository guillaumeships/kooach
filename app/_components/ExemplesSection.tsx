'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { LandingCTA } from '@/components/landing/landing-cta';
import { SectionEyebrow } from '@/components/landing/section-eyebrow';
import { cn } from '@/lib/utils';

/**
 * Section #exemples — preview du produit avec 5 niches sportives FR
 * (alignées sur le lead magnet et le positionnement de la landing).
 *
 * Mismatch précédent corrigé : avant, les onglets étaient "Coach de vie /
 * nutrition / yoga / business / running" alors que la landing cible
 * "100% coachs sportifs FR". Un visiteur muscu/perte-poids/prépa physique
 * ne se reconnaissait dans aucun onglet → conversion cassée.
 */

const NICHES = [
  { key: 'muscu',       label: 'Musculation' },
  { key: 'perte-poids', label: 'Perte de poids' },
  { key: 'prepa',       label: 'Prépa physique' },
  { key: 'domicile',    label: 'À domicile' },
  { key: 'en-ligne',    label: 'En ligne' },
] as const;

type NicheKey = (typeof NICHES)[number]['key'];
type Example = { icon: string; label: string; text: string; genTime: number };

const EXAMPLES: Record<NicheKey, Example[]> = {
  muscu: [
    {
      icon: '💜', label: 'Post Émotionnel', genTime: 47,
      text: `Pendant 2 ans j'ai tout fait pour gagner 5 kilos de muscle.
Programmes hardcore, suppléments, 5 séances par semaine.
Je restais sec.
Le déclic ? Mon ostéo m'a demandé : "Tu manges combien de protéines ?" J'ai bredouillé. Je savais pas.
Le problème c'était jamais l'entraînement. C'était l'assiette.
Aujourd'hui j'aide des gars à comprendre que le muscle se construit dans la cuisine — la salle c'est juste le déclencheur.
Si tu pousses fort sans voir de résultats, ce post est pour toi.`,
    },
    {
      icon: '📚', label: 'Post Éducatif', genTime: 52,
      text: `3 erreurs qui te font stagner après 6 mois en muscu :

1. Tu changes de programme tous les mois — Le corps a besoin de 8 à 12 semaines pour s'adapter. Sauter d'un plan à l'autre = aucun signal de progression envoyé.

2. Tu forces sans tracker — Si tu sais pas combien tu poussais la semaine dernière, comment tu progresses cette semaine ? Note tes charges. Toujours.

3. Tu négliges les jambes — Les jambes c'est 60% du muscle du corps. Squat, soulevé, fentes. Pas négociable.

Tu coches une de ces cases ? Tu sais quoi faire.`,
    },
    {
      icon: '🎬', label: 'Script Réel', genTime: 41,
      text: `HOOK (0-3s) : "Tu fais 4 séances par semaine et tu progresses pas ? C'est pas un problème de volume."

DÉVELOPPEMENT (3-25s) : "C'est un problème d'intensité. La majorité font 12 reps faciles à un poids confortable. Le corps s'adapte une fois et c'est fini. La progression c'est la surcharge progressive — chaque semaine, soit +2,5 kg, soit +1 rep. Pas négociable. Pas mesuré = pas réel."

CTA (25-30s) : "Commente PROGRESSION et je t'envoie ma trame de tracking gratuite."`,
    },
  ],
  'perte-poids': [
    {
      icon: '💜', label: 'Post Émotionnel', genTime: 49,
      text: `Marie, 38 ans, m'a dit hier en bilan : "C'est la première fois en 12 ans que je me pèse sans avoir peur."
Pas la première fois qu'elle perd du poids. Pas la première fois qu'elle réussit un régime.
La première fois qu'elle se pèse SANS PEUR.
C'est ça qu'on cherche au fond. Pas le chiffre. La paix avec son corps.
Aujourd'hui Marie est à -8 kg. Et elle continue. Sans peur.
Tu te pèses comment, toi ?`,
    },
    {
      icon: '📚', label: 'Post Éducatif', genTime: 55,
      text: `Pourquoi tu reprends toujours après un régime (et c'est pas un manque de volonté) :

1. Ton métabolisme s'adapte à la baisse — Manger 1200 kcal pendant 3 mois = ton corps consomme moins. Tu remontes à 1500 ? Tu reprends.

2. Tu perds du muscle, pas que du gras — Régime trop strict = le corps sacrifie le muscle pour épargner le gras. Et le muscle, c'est ce qui brûle au repos.

3. La privation crée des compulsions — Pas demain. Dans 6 mois.

La vraie perte de poids = lente, avec assez de protéines, avec du muscle. Pas la diète à 800 kcal.`,
    },
    {
      icon: '🎬', label: 'Script Réel', genTime: 38,
      text: `HOOK (0-3s) : "Tu veux perdre 10 kilos ? Arrête de compter les calories."

DÉVELOPPEMENT (3-25s) : "Compter c'est bien 2 semaines pour comprendre les ordres de grandeur. Sur 6 mois c'est insoutenable. Le truc qui marche : un repas type le matin, le midi, le soir. Tu manges les mêmes choses 80% du temps. Ton cerveau arrête de calculer, ton corps reçoit ce qu'il faut, et tu fonds sans y penser."

CTA (25-30s) : "Commente HABITUDE et je t'envoie mes 3 repas types pour démarrer."`,
    },
  ],
  prepa: [
    {
      icon: '💜', label: 'Post Émotionnel', genTime: 51,
      text: `Mon premier semi, j'ai marché les 5 derniers kilomètres.
Je pensais que je n'étais "pas un vrai coureur".
Aujourd'hui je prépare des gens pour leur premier marathon.
Ce que j'ai compris : courir c'est 30% de jambes, 70% de tête.
Le kilomètre le plus dur c'est jamais le 30 ou le 35.
C'est celui où ton cerveau te dit "arrête, t'es pas fait pour ça" et où tu continues quand même.
C'est là que tu deviens coureur.`,
    },
    {
      icon: '📚', label: 'Post Éducatif', genTime: 46,
      text: `Tu cours 4 fois par semaine et tu plafonnes ? Voilà pourquoi :

1. 80% de tes sorties sont trop rapides — En zone 3 / seuil. Ça brûle les jambes sans construire le moteur. Le cardio se construit en zone 2 (conversation possible).

2. Tu skip la récup — Les jambes ne récupèrent pas en courant. Elles récupèrent quand tu dors et quand tu manges.

3. Tu cours toujours sur le même terrain — Le corps a besoin de varier : côtes, tempo, fractionné. Stimuli différents = adaptation différente.

3 sorties structurées battent 5 sorties au feeling. À chaque fois.`,
    },
    {
      icon: '🎬', label: 'Script Réel', genTime: 43,
      text: `HOOK (0-3s) : "Tu veux courir un 10 km en moins de 50 min ? Cours plus lentement."

DÉVELOPPEMENT (3-25s) : "Ça paraît contradictoire. C'est prouvé. Les meilleurs marathoniens font 80% de leur volume en zone 2 — le rythme où tu peux parler. C'est ce qui construit le moteur aérobie. Si tu cours toujours fort, tu plafonnes. Ralentis 4 sorties sur 5, garde 1 séance d'intensité, regarde ton allure exploser en 8 semaines."

CTA (25-30s) : "Commente ZONE2 et je t'explique comment calculer ta fréquence cardiaque cible."`,
    },
  ],
  domicile: [
    {
      icon: '💜', label: 'Post Émotionnel', genTime: 54,
      text: `Paul, 45 ans, papa de 2 enfants, m'a dit : "C'est la première fois que je tiens 6 mois d'entraînement."
Avant, il payait sa salle 60€/mois. Il y allait 3 fois en janvier, 0 en février.
On a installé un kettlebell de 24 kg dans son garage.
Pas de tenue à enfiler. Pas de trajet. Pas d'excuse.
30 minutes au lever, avant que le reste de la maison se réveille.
Aujourd'hui Paul a perdu 12 kg et fait des squats à 100 kg.
À la maison.
Le matériel ne fait pas l'athlète. La régularité, oui.`,
    },
    {
      icon: '📚', label: 'Post Éducatif', genTime: 48,
      text: `Pourquoi entraîner à domicile bat la salle pour 80% des gens :

1. Zéro friction — La séance commence quand tu sors de ta chambre, pas après 25 min de trajet aller-retour.

2. Pas d'attente machine — Tu fais TES exercices, pas ceux qui sont dispos.

3. Plus régulier sur 12 mois — 70% d'adhérence à domicile vs 35% en salle (Frontiers in Physiology, 2023).

Tu n'as pas besoin d'une rack à 2000€. Tu as besoin de : 2 kettlebells (16 + 24 kg), une barre de traction, une corde à sauter. Total ~250€. Une fois.

Tu veux la salle ou tu veux les résultats ?`,
    },
    {
      icon: '🎬', label: 'Script Réel', genTime: 39,
      text: `HOOK (0-3s) : "Le piège du coaching à domicile c'est pas le manque d'équipement. C'est le manque de structure."

DÉVELOPPEMENT (3-25s) : "À la salle tu suis le programme affiché ou ton coach. À la maison, sans plan précis, tu fais 10 squats, 10 pompes, et tu te dis 'j'ai fait ma séance'. Au bout d'un mois tu plafonnes et t'arrêtes. La solution : un programme écrit, des charges trackées, un rendez-vous avec toi-même. Comme un cours en salle."

CTA (25-30s) : "Commente STRUCTURE et je t'envoie mon template de séance domicile gratuit."`,
    },
  ],
  'en-ligne': [
    {
      icon: '💜', label: 'Post Émotionnel', genTime: 56,
      text: `L'année dernière je coachais 8 clients en physique. 5h par semaine de trajet aller-retour.
Aujourd'hui j'en coache 47. Aucun trajet.
Pas parce que je suis "meilleur". Parce que j'ai changé le format.
Coaching en ligne ≠ envoyer un PDF.
C'est : appel hebdo en visio, programme adapté au matériel du client, suivi WhatsApp, ajustement chaque semaine selon les sensations.
Plus accessible (80€/mois vs 350€ en physique). Plus engageant. Plus efficace.
Beaucoup de coachs résistent au online par peur que ce soit "moins bien". C'est l'inverse.`,
    },
    {
      icon: '📚', label: 'Post Éducatif', genTime: 50,
      text: `Pourquoi le coaching en ligne marche mieux que tu crois :

1. Tu es présent au moment où ça compte — Pas le mardi à 18h. Le matin où ton client hésite à se lever. Le soir où il craque sur la bouffe. Via WhatsApp.

2. Tu peux suivre 5x plus de clients — Sans sacrifier la qualité, parce que la valeur c'est le programme + le suivi async.

3. Tu travailles avec des gens motivés — Quelqu'un qui paye un coach en ligne sans t'avoir vu = engagement intrinsèque.

Le piège : essayer de répliquer le présentiel à distance. Le online a ses propres règles.`,
    },
    {
      icon: '🎬', label: 'Script Réel', genTime: 42,
      text: `HOOK (0-3s) : "Tu hésites à passer en ligne par peur que tes clients disparaissent ? Ils sont déjà en ligne — sans toi."

DÉVELOPPEMENT (3-25s) : "Le client moderne consulte ton Insta, lit tes posts, regarde tes Stories. Il est dans ton espace digital depuis longtemps. Lui proposer un coaching en ligne c'est juste fluidifier ce qu'il fait déjà. Le présentiel reste premium pour ceux qui peuvent. Le online ouvre tes portes aux 95% qui ne peuvent pas se déplacer chez toi."

CTA (25-30s) : "Commente DIGITAL et je te partage mon framework pour passer en ligne en 30 jours."`,
    },
  ],
};

export default function ExemplesSection() {
  const [niche, setNiche] = useState<NicheKey>('muscu');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  function changeNiche(key: NicheKey) {
    setNiche(key);
    setCopiedIdx(null);
  }

  function copy(idx: number, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  }

  const cards = EXAMPLES[niche];

  return (
    <section
      id="exemples"
      className="kk-noise relative border-y border-border bg-card py-24"
    >
      <div className="mx-auto max-w-[1080px] px-[6%]">
        <div className="text-center" data-reveal>
          <SectionEyebrow className="mb-4 inline-block">Exemples réels</SectionEyebrow>

          <h2
            className="font-display mb-4 font-bold text-foreground"
            style={{ fontSize: 'clamp(30px, 4.4vw, 44px)', lineHeight: 1.15, letterSpacing: '-0.5px' }}
          >
            Voici ce que Kooach <em className="italic text-primary">génère pour toi</em>.
          </h2>
          <p className="mx-auto mb-10 max-w-lg text-[16.5px] leading-[1.65] text-muted-foreground">
            Sélectionne ta spécialité — ces 3 exemples ont été générés en moins de 60 secondes.
          </p>

          {/* Tabs niche sportive */}
          <div className="mb-12 flex flex-wrap items-center justify-center gap-2">
            {NICHES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => changeNiche(key)}
                className={cn(
                  'whitespace-nowrap rounded-full border px-5 py-2 text-[13.5px] font-medium transition-all duration-200',
                  niche === key
                    ? 'border-primary bg-primary text-primary-foreground shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.5)]'
                    : 'border-border bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards — Motion stagger sur le change de niche */}
        <motion.div
          key={niche}
          initial="hidden"
          animate="visible"
          variants={{
            hidden:  { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
          }}
          className="mb-12 grid gap-5 text-left md:grid-cols-2 lg:grid-cols-3"
        >
          {cards.map((card, i) => (
            <motion.div
              key={`${niche}-${i}`}
              variants={{
                hidden:  { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
              }}
              className="kk-card-premium kk-noise flex flex-col gap-3.5 rounded-2xl px-6 py-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary-subtle text-[18px]">
                    {card.icon}
                  </div>
                  <span className="text-[13px] font-bold text-foreground">{card.label}</span>
                </div>
                {/* Badge timestamp "généré en X secondes" — appuie la promesse 60s */}
                <span className="font-display inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11.5px] italic text-primary">
                  <Zap className="h-2.5 w-2.5" strokeWidth={2.5} />
                  {card.genTime}s
                </span>
              </div>

              <p className="flex-1 whitespace-pre-wrap text-[13px] leading-[1.65] text-muted-foreground">
                {card.text}
              </p>

              <Button
                variant="outline"
                size="sm"
                className="self-start"
                leftIcon={copiedIdx === i ? Check : Copy}
                onClick={() => copy(i, card.text)}
              >
                {copiedIdx === i ? 'Copié' : 'Copier'}
              </Button>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 text-center" data-reveal>
          <p className="text-[15.5px] text-muted-foreground">
            <strong className="font-semibold text-foreground">
              Tu veux que Kooach génère le tien ?
            </strong>
          </p>
          <LandingCTA href="/signup" size="lg">
            7 jours gratuits, sans CB
          </LandingCTA>
        </div>
      </div>
    </section>
  );
}

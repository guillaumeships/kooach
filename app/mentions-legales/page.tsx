/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { SectionEyebrow } from '@/components/landing/section-eyebrow';

export const metadata: Metadata = {
  title: 'Mentions légales — Kooach',
  robots: 'noindex',
};

// ─── Nav (pill rounded cohérent landing) ────────────────────────────────────

function Nav() {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 px-4 pt-3 sm:px-6 sm:pt-4">
      <div className="mx-auto flex h-14 max-w-[1180px] items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-5 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        <Link
          href="/"
          className="font-display flex items-center gap-2 text-[20px] italic tracking-tight text-primary no-underline"
        >
          <Image src="/img/logo.svg" alt="" width={24} height={24} className="shrink-0" />
          Kooach
        </Link>
        <Link
          href="/"
          className="text-[13.5px] font-medium text-muted-foreground no-underline transition-colors hover:text-foreground"
        >
          ← Retour à l'accueil
        </Link>
      </div>
    </nav>
  );
}

// ─── Footer ─────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-border bg-card py-10">
      <div className="mx-auto max-w-[1080px] px-[6%]">
        <div className="flex flex-wrap items-center justify-between gap-4 max-sm:flex-col max-sm:text-center">
          <Link
            href="/"
            className="font-display text-[18px] italic tracking-tight text-primary no-underline"
          >
            Kooach
          </Link>
          <div className="flex flex-wrap gap-6 max-sm:justify-center">
            {[
              { href: '/', label: 'Accueil' },
              { href: '/#tarifs', label: 'Tarifs' },
              { href: '/#faq', label: 'FAQ' },
              { href: '/mentions-legales', label: 'Mentions légales' },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="text-[13px] text-muted-foreground no-underline transition-colors hover:text-foreground"
              >
                {label}
              </a>
            ))}
          </div>
          <div className="text-[13px] text-muted-foreground/70">© 2026 Kooach</div>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MentionsLegales() {
  return (
    <>
      <Nav />
      <main className="kk-noise relative bg-background pb-24 pt-32 sm:pt-36">
        <div className="mx-auto max-w-[760px] px-[6%]">
          <SectionEyebrow className="mb-3 inline-block">Légal</SectionEyebrow>
          <h1
            className="font-display mb-3 font-bold text-foreground"
            style={{ fontSize: 'clamp(34px, 5vw, 52px)', lineHeight: 1.1, letterSpacing: '-1.2px' }}
          >
            Mentions <em className="italic text-primary">légales</em>.
          </h1>
          <p className="mb-12 border-b border-border/60 pb-10 text-[14.5px] text-muted-foreground">
            Dernière mise à jour : 30 avril 2026
          </p>

          {/* 1. Éditeur */}
          <Section title="1. Éditeur du site">
            <Table
              rows={[
                ['Nom', 'Guillaume Thomas'],
                ['Statut', 'Auto-entrepreneur'],
                ['SIRET', '104 121 785 00018'],
                ['Nom commercial', 'Gten / Kooach'],
                [
                  'Adresse email',
                  <a
                    key="mail"
                    href="mailto:contact@kooach.fr"
                    className="font-medium text-primary hover:underline"
                  >
                    contact@kooach.fr
                  </a>,
                ],
              ]}
            />
          </Section>

          <Divider />

          {/* 2. Hébergement */}
          <Section title="2. Hébergement">
            <Table
              rows={[
                ['Hébergeur', 'Vercel Inc.'],
                ['Adresse', '340 Pine Street, Suite 1501\nSan Francisco, CA 94104 — États-Unis'],
                [
                  'Site',
                  <a
                    key="vercel"
                    href="https://vercel.com"
                    target="_blank"
                    rel="noopener"
                    className="font-medium text-primary hover:underline"
                  >
                    vercel.com
                  </a>,
                ],
              ]}
            />
          </Section>

          <Divider />

          {/* 3. Description */}
          <Section title="3. Description du service">
            <P>
              Kooach est un service de génération automatique de contenu marketing par
              intelligence artificielle, destiné aux coachs bien-être et sportifs francophones.
            </P>
            <P>
              Le service produit, à la demande de l'utilisateur, des contenus éditoriaux (posts
              Instagram, newsletters, emails, scripts) à partir d'un profil renseigné par
              l'utilisateur. Ces contenus sont générés par un modèle de langage tiers (Anthropic
              Claude).
            </P>
            <H3>Avertissement important concernant l'intelligence artificielle</H3>
            <InfoBox>
              <P>
                <strong>
                  Les contenus générés par Kooach sont fournis « tels quels » et à titre
                  indicatif uniquement.
                </strong>{' '}
                Les modèles d'intelligence artificielle peuvent produire des informations
                inexactes, incomplètes, obsolètes ou inappropriées (hallucinations). L'utilisateur
                reconnaît expressément que :
              </P>
              <ul className="mb-0 mt-2 flex flex-col gap-1.5 pl-5">
                <Li>
                  il est seul responsable de la vérification de l'exactitude, de la pertinence et
                  de la licéité de tout contenu avant sa publication ;
                </Li>
                <Li>
                  Kooach et son éditeur ne sauraient être tenus responsables des erreurs,
                  omissions, diffamations, violations de droits de propriété intellectuelle ou
                  tout autre dommage résultant de l'utilisation des contenus générés ;
                </Li>
                <Li>
                  l'utilisateur assume l'entière responsabilité de l'utilisation, de la
                  modification et de la publication des contenus produits par le service.
                </Li>
              </ul>
            </InfoBox>
          </Section>

          <Divider />

          {/* 4. CGV */}
          <Section title="4. Conditions générales de vente">
            <H3>Abonnement</H3>
            <P>
              L'accès à Kooach est proposé sous forme d'abonnement mensuel au tarif de{' '}
              <strong>29 € TTC/mois</strong> après une période d'essai de{' '}
              <strong>7 jours</strong>. L'abonnement est renouvelé automatiquement chaque mois à
              la date anniversaire de souscription. Le paiement est traité par Stripe, Inc.
            </P>
            <H3>Essai gratuit</H3>
            <P>
              Un essai gratuit de 7 jours est proposé. Une carte bancaire est requise à
              l'inscription via Stripe, mais{' '}
              <strong>aucun débit n'est effectué pendant la période d'essai</strong>. À l'issue de
              l'essai, l'abonnement démarre automatiquement sauf résiliation avant la fin de la
              période. L'utilisateur peut résilier à tout moment sans frais.
            </P>
            <InfoBox>
              <P>
                <strong>L'essai gratuit de 7 jours est sans engagement.</strong> Votre carte ne
                sera pas débitée pendant la période d'essai.
              </P>
            </InfoBox>
            <H3>Droit de rétractation</H3>
            <InfoBox>
              <P>
                Conformément à l'article L.221-18 du Code de la consommation, vous disposez d'un
                délai de <strong>14 jours</strong> à compter de la souscription pour exercer
                votre droit de rétractation, sans avoir à justifier de motifs. Pour exercer ce
                droit, envoyez un email à{' '}
                <a
                  href="mailto:contact@kooach.fr"
                  className="font-medium text-primary hover:underline"
                >
                  contact@kooach.fr
                </a>
                . Le remboursement sera effectué dans les 14 jours suivant votre demande, par le
                même moyen de paiement que celui utilisé lors de la transaction.
              </P>
            </InfoBox>
            <H3>Résiliation</H3>
            <P>
              L'abonnement peut être résilié à tout moment, sans préavis ni frais, directement
              depuis l'espace client Stripe ou par email à{' '}
              <a
                href="mailto:contact@kooach.fr"
                className="font-medium text-primary hover:underline"
              >
                contact@kooach.fr
              </a>
              . L'accès au service reste actif jusqu'à la fin de la période déjà facturée.
            </P>
          </Section>

          <Divider />

          {/* 5. RGPD */}
          <Section title="5. Données personnelles (RGPD)">
            <P>
              Conformément au Règlement Général sur la Protection des Données (RGPD — UE
              2016/679) et à la loi Informatique et Libertés, vous disposez des droits suivants
              sur vos données : accès, rectification, effacement, limitation du traitement et
              portabilité.
            </P>
            <H3>Données collectées</H3>
            <ul className="my-2 flex flex-col gap-1.5 pl-5">
              <Li>
                <strong>Adresse email</strong> — collectée uniquement via Stripe au moment du
                paiement ou de l'inscription. Elle est utilisée pour envoyer le lien d'accès à
                l'application et pour la gestion de l'abonnement.
              </Li>
              <Li>
                <strong>Contenu du profil</strong> (spécialité, style, mots clés, cible) — saisi
                dans l'application lors d'une génération. Ces données sont transmises à l'API
                Anthropic pour produire le contenu et ne sont pas conservées de manière
                permanente côté serveur Kooach.
              </Li>
            </ul>
            <H3>Sous-traitants</H3>
            <Table
              rows={[
                ['Stripe, Inc.', 'Traitement des paiements'],
                ['Anthropic, PBC', 'Génération de contenu par IA'],
                ['Resend, Inc.', 'Envoi des emails transactionnels'],
                ['Vercel, Inc.', "Hébergement de l'application"],
              ]}
            />
            <H3>Durée de conservation</H3>
            <P>
              L'adresse email est conservée le temps de la relation commerciale (durée de
              l'abonnement + délai légal). Le contenu des profils et des générations n'est pas
              conservé de façon permanente sur nos serveurs. Seuls des logs techniques
              temporaires peuvent être conservés à des fins de sécurité et de débogage (maximum
              30 jours).
            </P>
            <H3>Exercer vos droits</H3>
            <P>
              Pour toute demande relative à vos données personnelles :{' '}
              <a
                href="mailto:contact@kooach.fr"
                className="font-medium text-primary hover:underline"
              >
                contact@kooach.fr
              </a>
              . En cas de réclamation non résolue, vous pouvez saisir la{' '}
              <a
                href="https://www.cnil.fr"
                target="_blank"
                rel="noopener"
                className="font-medium text-primary hover:underline"
              >
                CNIL
              </a>
              .
            </P>
          </Section>

          <Divider />

          {/* 6. Cookies */}
          <Section title="6. Cookies et traceurs">
            <P>
              Kooach n'utilise aucun cookie tiers ni outil de traçage publicitaire ou analytique.
              Un token d'authentification est stocké dans le{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-[13px] text-foreground">
                localStorage
              </code>{' '}
              de votre navigateur pour maintenir votre session. Ce token ne contient pas de
              données personnelles identifiables et peut être supprimé à tout moment en vidant le
              stockage local de votre navigateur.
            </P>
          </Section>

          <Divider />

          {/* 7. Propriété intellectuelle */}
          <Section title="7. Propriété intellectuelle">
            <P>
              Le nom Kooach, le logo et l'ensemble des éléments graphiques et textuels du site
              sont la propriété de Guillaume Thomas. Toute reproduction, même partielle, est
              interdite sans autorisation écrite préalable.
            </P>
            <P>
              Les contenus générés par l'IA appartiennent à l'utilisateur qui les a commandés,
              sous réserve des conditions d'utilisation d'Anthropic et des droits de tiers
              éventuellement présents dans les données d'entraînement des modèles.
            </P>
          </Section>

          <Divider />

          {/* 8. Droit applicable */}
          <Section title="8. Droit applicable et litiges">
            <P>
              Les présentes mentions légales sont soumises au droit français. En cas de litige, et
              à défaut de résolution amiable dans un délai de 30 jours, les tribunaux français
              seront compétents.
            </P>
            <P>
              Conformément aux articles L.616-1 et R.616-1 du Code de la consommation, en cas de
              litige non résolu, vous pouvez recourir gratuitement à un médiateur de la
              consommation. Médiateur compétent :{' '}
              <a
                href="https://www.mediateur-consommation-sas.fr"
                target="_blank"
                rel="noopener"
                className="font-medium text-primary hover:underline"
              >
                SAS Médiation Solution
              </a>
              .
            </P>
          </Section>

          <Divider />

          {/* 9. CGU */}
          <Section title="9. Conditions Générales d'Utilisation (CGU)">
            <H3>Article 1 – Objet</H3>
            <P>
              Les présentes CGU ont pour objet de définir les modalités d'accès et d'utilisation
              du service Kooach proposé par Guillaume Thomas, auto-entrepreneur, SIRET 104 121
              785 00018 (ci-après « l'Éditeur »).
            </P>

            <H3>Article 2 – Accès au service</H3>
            <P>
              L'accès à Kooach est réservé aux personnes majeures capables juridiquement.
              L'utilisateur s'engage à fournir des informations exactes lors de son inscription
              et à maintenir son profil à jour.
            </P>

            <H3>Article 3 – Obligations de l'Utilisateur</H3>
            <P>L'utilisateur s'engage à :</P>
            <ul className="my-2 flex flex-col gap-1.5 pl-5">
              <Li>utiliser le service conformément à sa destination et à la loi ;</Li>
              <Li>
                ne pas tenter de contourner les mesures de sécurité ou de limiter les
                fonctionnalités ;
              </Li>
              <Li>
                ne pas utiliser le service pour générer du contenu illégal, haineux, diffamatoire,
                discriminatoire, ou portant atteinte aux droits de tiers ;
              </Li>
              <Li>vérifier l'exactitude et la licéité de tout contenu avant publication.</Li>
            </ul>

            <H3>Article 4 – Contenus interdits</H3>
            <P>Il est strictement interdit d'utiliser Kooach pour générer :</P>
            <ul className="my-2 flex flex-col gap-1.5 pl-5">
              <Li>du contenu incitant à la haine, à la violence ou à la discrimination ;</Li>
              <Li>du contenu diffamatoire ou portant atteinte à la vie privée ;</Li>
              <Li>du contenu trompeur ou constituant une pratique commerciale déloyale ;</Li>
              <Li>du contenu violant des droits de propriété intellectuelle de tiers ;</Li>
              <Li>du contenu à caractère sexuel ou pornographique ;</Li>
              <Li>du contenu promouvant des activités illégales.</Li>
            </ul>
            <P>
              Toute violation de cet article peut entraîner la suspension immédiate du compte
              sans préavis ni remboursement.
            </P>

            <H3>Article 5 – Propriété intellectuelle sur les contenus générés</H3>
            <P>
              Les contenus générés par Kooach appartiennent à l'utilisateur qui les a commandés,
              sous réserve des droits éventuellement détenus par Anthropic ou par des tiers sur
              les données d'entraînement des modèles. L'Éditeur ne revendique aucun droit de
              propriété sur les contenus générés.
            </P>

            <H3>Article 6 – Non-responsabilité et limitation de garantie</H3>
            <P>
              <strong>6.1.</strong> Le service est fourni « en l'état » et « selon disponibilité
              ». L'Éditeur ne garantit pas que le service sera exempt d'erreurs, ininterrompu ou
              adapté à un usage particulier.
            </P>
            <P>
              <strong>6.2.</strong> En raison de la nature des modèles d'intelligence
              artificielle, l'Éditeur ne peut garantir l'exactitude, l'originalité, l'absence de
              biais ou la non-violation de droits de tiers des contenus générés. L'utilisateur
              reconnaît expressément ce risque et renonce à tout recours contre l'Éditeur à ce
              titre.
            </P>
            <P>
              <strong>6.3.</strong> L'Éditeur ne saurait être tenu responsable des dommages
              directs ou indirects (perte de données, perte de clientèle, atteinte à l'image,
              etc.) résultant de l'utilisation du service ou des contenus générés.
            </P>

            <H3>Article 7 – Résiliation</H3>
            <P>
              L'Éditeur se réserve le droit de suspendre ou de résilier l'accès au service en cas
              de violation des présentes CGU, sans préavis ni indemnité. L'utilisateur peut
              résilier son abonnement à tout moment conformément aux CGV.
            </P>

            <H3>Article 8 – Modifications des CGU</H3>
            <P>
              L'Éditeur se réserve le droit de modifier les présentes CGU à tout moment. Les
              modifications entrent en vigueur dès leur publication sur le site. L'utilisation
              continue du service après modification vaut acceptation des nouvelles CGU.
            </P>
          </Section>
        </div>
      </main>
      <Footer />
    </>
  );
}

// ─── Micro-composants (refondus 2026) ────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-14">
      <h2 className="font-display mb-4 text-[22px] font-bold tracking-tight text-foreground">
        {title}
      </h2>
      {children}
    </div>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display mb-2.5 mt-6 text-[16.5px] font-bold tracking-tight text-foreground">
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-3 text-[15px] text-foreground/80 last:mb-0"
      style={{ lineHeight: 1.75 }}
    >
      {children}
    </p>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="text-[14.5px] text-foreground/80" style={{ lineHeight: 1.65 }}>
      {children}
    </li>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 rounded-xl border border-primary/20 bg-primary-subtle/50 px-6 py-5">
      <div className="text-foreground/90">{children}</div>
    </div>
  );
}

function Divider() {
  return <hr className="my-12 border-0 border-t border-border/60" />;
}

function Table({ rows }: { rows: (string | React.ReactNode)[][] }) {
  return (
    <table className="mb-3 w-full text-[14.5px]" style={{ borderCollapse: 'collapse' }}>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className={i < rows.length - 1 ? 'border-b border-border/40' : ''}>
            <td className="w-[38%] whitespace-nowrap py-2.5 pr-4 align-top font-semibold text-foreground max-sm:w-auto max-sm:whitespace-normal">
              {row[0]}
            </td>
            <td className="py-2.5 align-top text-foreground/75" style={{ lineHeight: 1.65 }}>
              {typeof row[1] === 'string'
                ? row[1].split('\n').map((line, j, arr) => (
                    <span key={j}>
                      {line}
                      {j < arr.length - 1 && <br />}
                    </span>
                  ))
                : row[1]}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

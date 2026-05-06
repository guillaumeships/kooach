import Image from 'next/image';
import Link from 'next/link';

/**
 * Footer landing 2026 : brand + tagline + colonnes Produit/Compte + bottom bar.
 * Réutilisé par la landing principale et les pages annexes.
 */
export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="mx-auto max-w-[1080px] px-[6%]">
        <div className="grid gap-8 sm:grid-cols-[auto_1fr_auto] sm:items-start sm:gap-12">
          <div>
            <Link
              href="/"
              className="font-display flex items-center gap-2 text-[20px] italic tracking-tight text-primary no-underline"
            >
              <Image src="/img/logo.svg" alt="" width={22} height={22} className="shrink-0" />
              Kooach
            </Link>
            <p className="mt-2 max-w-[260px] text-[13px] leading-relaxed text-muted-foreground">
              Le ghost-writer IA des coachs sportifs FR. 7 contenus Instagram calibrés sur ton
              style — en 60 secondes.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 sm:justify-self-end">
            <div>
              <p className="font-display mb-3 text-[13.5px] italic text-muted-foreground">
                Produit
              </p>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {[
                  { href: '/#exemples', label: 'Exemples' },
                  { href: '/#tarifs', label: 'Tarifs' },
                  { href: '/#faq', label: 'FAQ' },
                  { href: '/generateur-accroches', label: 'Générateur d’accroches' },
                  { href: '/generateur-bio-instagram-coach-sportif', label: 'Générateur de bio' },
                  { href: '/blog', label: 'Blog' },
                  { href: '/newsletter', label: 'Newsletter' },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-[13px] text-muted-foreground no-underline transition-colors hover:text-foreground"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-display mb-3 text-[13.5px] italic text-muted-foreground">
                Compte
              </p>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {[
                  { href: '/login', label: 'Se connecter' },
                  { href: '/signup', label: 'Créer un compte' },
                  { href: '/recover-access', label: 'Retrouver mon accès' },
                  { href: '/qui-sommes-nous', label: 'Qui sommes-nous' },
                  { href: '/mentions-legales', label: 'Mentions légales' },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-[13px] text-muted-foreground no-underline transition-colors hover:text-foreground"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground/70">
            <span>© 2026 Kooach · Guillaume Thomas, auto-entrepreneur</span>
            <span aria-hidden>·</span>
            <span>SIRET 104 121 785 00018</span>
            <span aria-hidden>·</span>
            <a
              href="mailto:contact@kooach.fr"
              className="text-muted-foreground/80 underline-offset-2 hover:text-foreground hover:underline"
            >
              contact@kooach.fr
            </a>
          </div>
          <p className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground/70">
            🇫🇷 Made in France
          </p>
        </div>
      </div>
    </footer>
  );
}

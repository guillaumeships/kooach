import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion Kooach',
  robots: { index: false, follow: false },
};

export default function LegacyLinkLayout({ children }: { children: React.ReactNode }) {
  return children;
}

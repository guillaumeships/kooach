'use client';
import { useEffect } from 'react';

/**
 * Ajoute la classe `js-reveal` sur <html> dès que JS est chargé,
 * puis observe tous les [data-reveal] pour leur ajouter `revealed`
 * quand ils entrent dans le viewport.
 * Retourne null — pas de markup.
 */
export function ScrollReveal() {
  useEffect(() => {
    document.documentElement.classList.add('js-reveal');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    );

    document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}

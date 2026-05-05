'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  History,
  LogOut,
  Moon,
  Settings,
  Sparkles,
  Sun,
  User,
} from 'lucide-react';
import { useTheme } from 'next-themes';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { clearLocalAuth } from '@/lib/storage';

/**
 * Command menu global — déclenché par Cmd+K (ou Ctrl+K).
 * Pattern Linear / Vercel / Raycast : navigation + actions rapides.
 *
 * Monté dans /app/layout.tsx (route group authentifié uniquement).
 */
export function CommandMenu() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  function go(path: string) {
    setOpen(false);
    router.push(path);
  }

  async function logout() {
    setOpen(false);
    try {
      await createSupabaseBrowserClient().auth.signOut();
    } catch {}
    clearLocalAuth();
    router.push('/');
    router.refresh();
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Tape une commande ou cherche…" />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go('/app')}>
            <Sparkles />
            Créer du contenu
            <CommandShortcut>G C</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go('/app/history')}>
            <History />
            Historique
            <CommandShortcut>G H</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go('/app/account')}>
            <User />
            Mon compte
            <CommandShortcut>G A</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Apparence">
          <CommandItem onSelect={() => { setTheme('light'); setOpen(false); }}>
            <Sun />
            Thème clair
          </CommandItem>
          <CommandItem onSelect={() => { setTheme('dark'); setOpen(false); }}>
            <Moon />
            Thème sombre
          </CommandItem>
          <CommandItem onSelect={() => { setTheme('system'); setOpen(false); }}>
            <Settings />
            Thème système
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Compte">
          <CommandItem onSelect={logout}>
            <LogOut />
            Se déconnecter
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Download,
  Heart,
  Home,
  LogOut,
  Menu,
  Search,
  X,
} from "lucide-react";
import { InstallAppButton } from "@/components/pwa";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar } from "@/components/user-avatar";
import { NavLinks } from "@/components/nav-links";
import { Wordmark } from "@/components/wordmark";
import { cn } from "@/lib/utils";
import type { PublicUser } from "@/lib/types";

const TABS = [
  { href: "/home", label: "Início", icon: Home },
  { href: "/search", label: "Buscar", icon: Search },
  { href: "/import", label: "Importar", icon: Download },
  { href: "/favorites", label: "Favoritos", icon: Heart },
] as const;

export function MobileHeader({
  user,
  menuOpen,
  onToggleMenu,
}: {
  user: PublicUser;
  menuOpen: boolean;
  onToggleMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line glass-panel px-3 py-2.5 pt-[max(0.65rem,env(safe-area-inset-top))] md:hidden">
      <button
        type="button"
        onClick={onToggleMenu}
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-surface-2"
        aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <Link href="/home" className="min-w-0 flex-1">
        <Wordmark withMark size="sm" priority className="max-w-full" />
      </Link>
      <ThemeToggle />
      <Link href="/perfil" aria-label="Abrir perfil">
        <UserAvatar src={user.avatarUrl} name={user.profileName} size={40} />
      </Link>
    </header>
  );
}

export function MobileDrawer({
  user,
  open,
  onClose,
}: {
  user: PublicUser;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    onClose();
    router.push("/");
    router.refresh();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-ink/55 backdrop-blur-sm"
        aria-label="Fechar menu"
        onClick={onClose}
      />
      <aside
        id="mobile-menu"
        className="mobile-drawer absolute inset-y-0 left-0 flex w-[min(20.5rem,88vw)] flex-col border-r border-line bg-background shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Wordmark withMark size="sm" />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        <p className="px-5 text-[11px] font-bold tracking-[0.28em] text-muted">
          MUSIC. INDIA. EVERYWHERE.
        </p>

        <nav className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4">
          <NavLinks onNavigate={onClose} />
        </nav>

        <div className="space-y-3 border-t border-line p-4">
          <Link
            href="/perfil"
            onClick={onClose}
            className="flex items-center gap-3 rounded-2xl p-1"
          >
            <UserAvatar src={user.avatarUrl} name={user.profileName} size={44} />
            <div className="min-w-0">
              <p className="truncate font-extrabold">{user.profileName}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
          </Link>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-muted">Tema</span>
            <ThemeToggle />
          </div>
          <InstallAppButton />
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-bold text-muted"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>
    </div>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="border-t border-line glass-panel px-1 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1 md:hidden">
      <div className="grid grid-cols-4">
        {TABS.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[11px] font-extrabold",
                active ? "text-coral" : "text-muted",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-2xl",
                  active && "bg-abdu-gradient text-white shadow-md",
                )}
              >
                <Icon size={18} />
              </span>
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

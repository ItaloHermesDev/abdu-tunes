"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Disc3,
  Heart,
  Home,
  LogOut,
  Search,
  Sparkles,
  Download,
  UserRound,
  WifiOff,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { InstallAppButton } from "@/components/pwa";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import type { PublicUser } from "@/lib/types";

const LINKS = [
  { href: "/home", label: "Início", icon: Home },
  { href: "/search", label: "Buscar", icon: Search },
  { href: "/import", label: "Importar", icon: Download },
  { href: "/albums", label: "Álbuns", icon: Disc3 },
  { href: "/tracks", label: "Faixas soltas", icon: Sparkles },
  { href: "/favorites", label: "Favoritos", icon: Heart },
  { href: "/offline", label: "Offline", icon: WifiOff },
  { href: "/perfil", label: "Perfil", icon: UserRound },
];

export function Sidebar({ user }: { user: PublicUser }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-line glass-panel md:flex">
      <div className="px-5 py-6">
        <Link href="/home" className="block">
          <Image
            src="/assets/logo-nome.png"
            alt="Abdu Tunes"
            width={210}
            height={84}
            className="h-auto w-full max-w-[190px]"
            priority
          />
        </Link>
        <p className="mt-3 text-[11px] font-bold tracking-[0.28em] text-muted">
          MUSIC. INDIA. EVERYWHERE.
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {LINKS.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition",
                active
                  ? "bg-abdu-gradient text-white shadow-lg"
                  : "text-muted hover:bg-surface-2 hover:text-foreground",
              )}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 border-t border-line p-4">
        <Link href="/perfil" className="flex items-center gap-3">
          <UserAvatar src={user.avatarUrl} name={user.profileName} size={44} />
          <div className="min-w-0">
            <p className="truncate font-extrabold">{user.profileName}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
        </Link>
        <div className="flex items-center justify-between gap-3">
          <ThemeToggle />
        </div>
        <InstallAppButton />
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-bold text-muted hover:text-foreground"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const items = [
    LINKS[0],
    LINKS[1],
    LINKS[2],
    LINKS[7],
    LINKS[6],
  ];

  return (
    <nav className="fixed inset-x-0 bottom-[5.5rem] z-30 mx-3 flex items-center justify-between rounded-3xl border border-line glass-panel px-2 py-2 md:hidden">
      {items.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-bold",
              active ? "text-coral" : "text-muted",
            )}
          >
            <Icon size={18} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

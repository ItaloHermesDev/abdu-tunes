"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Disc3,
  Download,
  Heart,
  Home,
  Search,
  Sparkles,
  UserRound,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const LINKS = [
  { href: "/home", label: "Início", icon: Home },
  { href: "/search", label: "Buscar", icon: Search },
  { href: "/import", label: "Importar", icon: Download },
  { href: "/albums", label: "Álbuns", icon: Disc3 },
  { href: "/tracks", label: "Faixas soltas", icon: Sparkles },
  { href: "/favorites", label: "Favoritos", icon: Heart },
  { href: "/offline", label: "Offline", icon: WifiOff },
  { href: "/perfil", label: "Perfil", icon: UserRound },
];

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {LINKS.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
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
    </>
  );
}

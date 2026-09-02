"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { InstallAppButton } from "@/components/pwa";
import { UserAvatar } from "@/components/user-avatar";
import { NavLinks } from "@/components/nav-links";
import { Wordmark } from "@/components/wordmark";
import type { PublicUser } from "@/lib/types";

export function Sidebar({ user }: { user: PublicUser }) {
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
          <Wordmark withMark priority />
        </Link>
        <p className="mt-3 text-[11px] font-bold tracking-[0.28em] text-muted">
          MUSIC. INDIA. EVERYWHERE.
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        <NavLinks />
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

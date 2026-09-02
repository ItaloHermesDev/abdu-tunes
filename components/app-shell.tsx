"use client";

import { useCallback, useState, type ReactNode } from "react";
import { PlayerProvider } from "@/components/player-provider";
import { PlayerBar } from "@/components/player";
import { Sidebar } from "@/components/sidebar";
import {
  MobileDrawer,
  MobileHeader,
  MobileNav,
} from "@/components/mobile-chrome";
import { OfflineBanner } from "@/components/pwa";
import { OfflineSync } from "@/components/offline-sync";
import type { PublicUser } from "@/lib/types";

export function AppShell({
  user,
  children,
}: {
  user: PublicUser;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <PlayerProvider>
      <OfflineSync />
      <OfflineBanner />
      <div className="mandala-bg min-h-screen">
        <div className="flex min-h-screen">
          <Sidebar user={user} />
          <div className="min-w-0 flex-1">
            <MobileHeader
              user={user}
              menuOpen={menuOpen}
              onToggleMenu={() => setMenuOpen((open) => !open)}
            />
            <main className="min-w-0 px-4 pb-[calc(10.25rem+env(safe-area-inset-bottom,0px))] pt-5 md:px-8 md:pb-32 md:pt-6">
              {children}
            </main>
          </div>
        </div>
        <MobileDrawer user={user} open={menuOpen} onClose={closeMenu} />
        <div className="fixed inset-x-0 bottom-0 z-40">
          <PlayerBar />
          <MobileNav />
        </div>
      </div>
    </PlayerProvider>
  );
}

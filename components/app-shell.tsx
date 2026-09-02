"use client";

import type { ReactNode } from "react";
import { PlayerProvider } from "@/components/player-provider";
import { PlayerBar } from "@/components/player";
import { MobileNav, Sidebar } from "@/components/sidebar";
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
  return (
    <PlayerProvider>
      <OfflineSync />
      <OfflineBanner />
      <div className="mandala-bg min-h-screen">
        <div className="flex min-h-screen">
          <Sidebar user={user} />
          <main className="min-w-0 flex-1 px-4 pb-40 pt-6 md:px-8 md:pb-32">
            {children}
          </main>
        </div>
        <MobileNav />
        <PlayerBar />
      </div>
    </PlayerProvider>
  );
}

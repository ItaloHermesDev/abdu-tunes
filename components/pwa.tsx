"use client";

import { useEffect, useState } from "react";
import { Download, WifiOff } from "lucide-react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }
  }, []);
  return null;
}

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;
  return (
    <div className="fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-abdu-gradient px-4 py-2 text-sm font-black text-white shadow-lg">
      <WifiOff size={16} />
      Modo offline
    </div>
  );
}

export function InstallAppButton() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setInstalled(standalone);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (installed) {
    return (
      <p className="text-center text-xs font-bold text-muted">App instalado</p>
    );
  }

  return (
    <button
      type="button"
      onClick={async () => {
        if (!prompt) {
          alert(
            "No navegador, use o menu e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.",
          );
          return;
        }
        await prompt.prompt();
        setPrompt(null);
      }}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-abdu-gradient px-4 py-2 text-sm font-black text-white"
    >
      <Download size={16} />
      Baixar o app
    </button>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const register = mode === "register";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const data = new FormData(event.currentTarget);
    const payload = Object.fromEntries(data.entries());
    const response = await fetch(
      register ? "/api/auth/register" : "/api/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const json = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(json.error || "Não foi possível continuar.");
      return;
    }
    router.push("/home");
    router.refresh();
  }

  return (
    <div className="mandala-bg relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-line glass-panel shadow-2xl md:grid-cols-2">
        <div className="relative hidden bg-ink p-10 text-white md:block">
          <img
            src="/assets/piloto.png"
            alt="Abdu Tunes"
            className="mx-auto h-auto w-56"
          />
          <p className="mt-8 text-center text-sm font-bold tracking-[0.35em] text-white/70">
            MUSIC. INDIA. EVERYWHERE.
          </p>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-magenta/20 to-transparent" />
        </div>
        <form onSubmit={onSubmit} className="space-y-5 p-8 md:p-10">
          <Wordmark withMark />
          <div>
            <h1 className="text-3xl font-black">
              {register ? "Criar conta" : "Entrar"}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {register
                ? "Guarde álbuns, faixas soltas e favoritos na sua biblioteca."
                : "Acesse sua biblioteca autenticada da Abdu Tunes."}
            </p>
          </div>
          {register ? (
            <label className="block space-y-1 text-sm font-bold">
              Nome
              <input
                name="name"
                required
                className="w-full rounded-2xl border border-line bg-surface-2 px-4 py-3 font-medium"
              />
            </label>
          ) : null}
          <label className="block space-y-1 text-sm font-bold">
            E-mail
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-2xl border border-line bg-surface-2 px-4 py-3 font-medium"
            />
          </label>
          <label className="block space-y-1 text-sm font-bold">
            Senha
            <input
              name="password"
              type="password"
              minLength={8}
              required
              className="w-full rounded-2xl border border-line bg-surface-2 px-4 py-3 font-medium"
            />
          </label>
          {error ? <p className="text-sm font-bold text-coral">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-abdu-gradient py-3 font-black text-white glow-abdu disabled:opacity-60"
          >
            {loading ? "Aguarde..." : register ? "Criar conta" : "Entrar"}
          </button>
          <p className="text-center text-sm text-muted">
            {register ? "Já tem conta?" : "Novo por aqui?"}{" "}
            <Link
              href={register ? "/login" : "/register"}
              className="font-extrabold text-coral"
            >
              {register ? "Entrar" : "Criar conta"}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

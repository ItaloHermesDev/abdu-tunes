"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile, PublicUser } from "@/lib/types";
import { UserAvatar } from "@/components/user-avatar";

export function ProfileStudio({ user }: { user: PublicUser }) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [name, setName] = useState(user.profileName);
  const [newName, setNewName] = useState("");
  const [status, setStatus] = useState("");

  async function load() {
    const response = await fetch("/api/profiles");
    const json = (await response.json()) as { profiles?: Profile[] };
    setProfiles(json.profiles || []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveName(event: React.FormEvent) {
    event.preventDefault();
    await fetch("/api/profiles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setStatus("Nome atualizado.");
    router.refresh();
  }

  async function uploadAvatar(file: File) {
    const data = new FormData();
    data.set("avatar", file);
    const response = await fetch("/api/profiles", { method: "PUT", body: data });
    if (!response.ok) {
      const json = (await response.json()) as { error?: string };
      setStatus(json.error || "Falha ao enviar avatar.");
      return;
    }
    setStatus("Avatar atualizado.");
    router.refresh();
    void load();
  }

  async function switchTo(id: string) {
    await fetch("/api/profiles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ switchTo: id }),
    });
    router.push("/home");
    router.refresh();
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    setNewName("");
    router.push("/home");
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Apagar este perfil e as músicas dele?")) return;
    await fetch("/api/profiles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleteId: id }),
    });
    router.refresh();
    void load();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-black md:text-4xl">Perfil</h1>
        <p className="text-muted">
          Cada perfil tem avatar, álbuns e faixas próprios.
        </p>
      </div>

      <section className="rounded-[2rem] border border-line glass-panel p-6">
        <div className="flex flex-wrap items-center gap-5">
          <label className="relative cursor-pointer">
            <UserAvatar src={user.avatarUrl} name={user.profileName} size={96} />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadAvatar(file);
              }}
            />
            <span className="absolute inset-x-0 -bottom-2 text-center text-xs font-bold text-coral">
              Trocar foto
            </span>
          </label>
          <form onSubmit={saveName} className="min-w-60 flex-1 space-y-3">
            <label className="block text-sm font-bold">
              Nome do perfil
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-line bg-background px-4 py-3"
              />
            </label>
            <button className="rounded-full bg-abdu-gradient px-5 py-2 font-black text-white">
              Salvar
            </button>
          </form>
        </div>
        {status ? <p className="mt-4 text-sm font-bold text-coral">{status}</p> : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-black">Todos os perfis</h2>
        <div className="grid gap-3">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3"
            >
              <UserAvatar src={profile.avatarUrl} name={profile.name} size={48} />
              <div className="min-w-0 flex-1">
                <p className="font-extrabold">{profile.name}</p>
                {profile.id === user.profileId ? (
                  <p className="text-xs font-bold text-coral">Ativo agora</p>
                ) : null}
              </div>
              {profile.id !== user.profileId ? (
                <button
                  type="button"
                  onClick={() => switchTo(profile.id)}
                  className="rounded-full border border-line px-3 py-1 text-sm font-bold"
                >
                  Entrar
                </button>
              ) : null}
              {profiles.length > 1 ? (
                <button
                  type="button"
                  onClick={() => remove(profile.id)}
                  className="text-sm font-bold text-coral"
                >
                  Apagar
                </button>
              ) : null}
            </div>
          ))}
        </div>
        <form onSubmit={create} className="flex flex-wrap gap-3 pt-2">
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Novo perfil"
            className="rounded-2xl border border-line bg-surface px-4 py-2.5"
            required
          />
          <button className="rounded-full bg-abdu-gradient px-5 py-2.5 font-black text-white">
            Criar perfil
          </button>
        </form>
      </section>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateAlbumForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/albums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    if (response.ok) {
      setTitle("");
      setDescription("");
      setOpen(false);
      router.refresh();
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-abdu-gradient px-5 py-2.5 font-black text-white glow-abdu"
      >
        Novo álbum
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Nome do álbum"
        className="rounded-2xl border border-line bg-surface px-4 py-2.5"
        required
      />
      <input
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Descrição (opcional)"
        className="rounded-2xl border border-line bg-surface px-4 py-2.5"
      />
      <button type="submit" className="rounded-full bg-abdu-gradient px-5 py-2.5 font-black text-white">
        Criar
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm font-bold text-muted">
        Cancelar
      </button>
    </form>
  );
}

export function EmptyState({
  title,
  text,
  actionHref,
  actionLabel,
}: {
  title: string;
  text: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-[2rem] border border-dashed border-line p-10 text-center">
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-2 text-muted">{text}</p>
      {actionHref && actionLabel ? (
        <a
          href={actionHref}
          className="mt-5 inline-flex rounded-full bg-abdu-gradient px-5 py-2.5 font-black text-white"
        >
          {actionLabel}
        </a>
      ) : null}
    </div>
  );
}

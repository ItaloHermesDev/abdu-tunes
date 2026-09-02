"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, ListMusic, Music2 } from "lucide-react";
import { looksLikePlaylist } from "@/lib/utils";

type AlbumOption = { id: string; title: string };

export function ImportPanel({ albums }: { albums: AlbumOption[] }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<"single" | "playlist">("single");
  const [destination, setDestination] = useState<"loose" | "album" | "new">(
    "loose",
  );
  const [albumId, setAlbumId] = useState(albums[0]?.id ?? "");
  const [albumTitle, setAlbumTitle] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [percent, setPercent] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const playlistHint = useMemo(() => looksLikePlaylist(url), [url]);

  async function start(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLogs([]);
    setPercent(0);
    setRunning(true);

    const response = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        mode,
        destination,
        albumId: destination === "album" ? albumId : undefined,
        albumTitle: destination === "new" ? albumTitle : undefined,
      }),
    });

    if (!response.body) {
      setError("O servidor não enviou progresso.");
      setRunning(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() || "";
      for (const chunk of chunks) {
        const dataLine = chunk
          .split("\n")
          .find((line) => line.startsWith("data: "));
        if (!dataLine) continue;
        const payload = JSON.parse(dataLine.slice(6)) as {
          message?: string;
          percent?: number;
          error?: string;
          done?: boolean;
        };
        if (payload.error) setError(payload.error);
        if (payload.message) {
          setLogs((current) => [...current.slice(-12), payload.message!]);
        }
        if (typeof payload.percent === "number") setPercent(payload.percent);
        if (payload.done) router.refresh();
      }
    }

    setRunning(false);
  }

  return (
    <form onSubmit={start} className="space-y-6">
      <div className="rounded-[1.6rem] border border-line glass-panel p-4 md:rounded-[2rem] md:p-8">
        <label className="block text-sm font-extrabold">
          Link do YouTube ou YouTube Music
          <input
            value={url}
            onChange={(event) => {
              const next = event.target.value;
              setUrl(next);
              if (looksLikePlaylist(next)) setMode("playlist");
            }}
            placeholder="https://www.youtube.com/watch?v=... ou playlist"
            className="mt-2 w-full rounded-2xl border border-line bg-background px-4 py-4 font-medium"
            required
          />
        </label>
        {playlistHint ? (
          <p className="mt-2 text-sm font-bold text-coral">
            Este link parece uma lista. Você pode baixar só a faixa ou a lista completa.
          </p>
        ) : null}

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-left ${
              mode === "single" ? "border-coral glow-abdu" : "border-line"
            }`}
          >
            <Music2 className="text-coral" />
            <span>
              <strong className="block">Só esta faixa</strong>
              <span className="text-sm text-muted">Baixa um MP3 solto ou para um álbum</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode("playlist")}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-left ${
              mode === "playlist" ? "border-coral glow-abdu" : "border-line"
            }`}
          >
            <ListMusic className="text-magenta" />
            <span>
              <strong className="block">Lista completa</strong>
              <span className="text-sm text-muted">Importa todas as faixas da playlist</span>
            </span>
          </button>
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-sm font-extrabold">Destino</p>
          <div className="grid gap-2">
            <label className="flex items-center gap-3 rounded-2xl border border-line px-4 py-3">
              <input
                type="radio"
                checked={destination === "loose"}
                onChange={() => setDestination("loose")}
              />
              Deixar solta (sem álbum)
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-line px-4 py-3">
              <input
                type="radio"
                checked={destination === "album"}
                onChange={() => setDestination("album")}
              />
              Salvar em um álbum existente
            </label>
            {destination === "album" ? (
              <select
                value={albumId}
                onChange={(event) => setAlbumId(event.target.value)}
                className="rounded-2xl border border-line bg-background px-4 py-3"
                required
              >
                {albums.length === 0 ? (
                  <option value="">Crie um álbum primeiro</option>
                ) : (
                  albums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {album.title}
                    </option>
                  ))
                )}
              </select>
            ) : null}
            <label className="flex items-center gap-3 rounded-2xl border border-line px-4 py-3">
              <input
                type="radio"
                checked={destination === "new"}
                onChange={() => setDestination("new")}
              />
              Criar um álbum novo agora
            </label>
            {destination === "new" ? (
              <input
                value={albumTitle}
                onChange={(event) => setAlbumTitle(event.target.value)}
                placeholder="Nome do álbum"
                className="rounded-2xl border border-line bg-background px-4 py-3"
                required
              />
            ) : null}
          </div>
        </div>

        <button
          type="submit"
          disabled={running}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-abdu-gradient px-6 py-3 font-black text-white glow-abdu disabled:opacity-60 md:w-auto"
        >
          <Download size={18} />
          {running ? "Importando..." : "Baixar MP3"}
        </button>
      </div>

      {(running || logs.length || error) && (
        <div className="rounded-[2rem] border border-line glass-panel p-6">
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full bg-abdu-gradient transition-all"
              style={{ width: `${Math.max(percent, running ? 4 : 0)}%` }}
            />
          </div>
          {error ? <p className="font-bold text-coral">{error}</p> : null}
          <ul className="space-y-1 text-sm text-muted">
            {logs.map((log, index) => (
              <li key={`${log}-${index}`}>{log}</li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}

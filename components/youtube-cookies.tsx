"use client";

import { useEffect, useState } from "react";
import { Cookie, Trash2 } from "lucide-react";

export function YouTubeCookiesCard() {
  const [configured, setConfigured] = useState(false);
  const [cookies, setCookies] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    const response = await fetch("/api/youtube-cookies");
    if (!response.ok) return;
    const json = (await response.json()) as { configured?: boolean };
    setConfigured(Boolean(json.configured));
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/youtube-cookies", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cookies }),
    });
    const json = (await response.json()) as { error?: string };
    setSaving(false);
    if (!response.ok) {
      setError(json.error || "Não foi possível salvar.");
      return;
    }
    setCookies("");
    setConfigured(true);
    setMessage("Cookies salvos. Pode importar de novo.");
  }

  async function remove() {
    setSaving(true);
    await fetch("/api/youtube-cookies", { method: "DELETE" });
    setSaving(false);
    setConfigured(false);
    setMessage("Cookies removidos.");
  }

  return (
    <form
      onSubmit={save}
      className="rounded-[1.6rem] border border-line glass-panel p-4 md:rounded-[2rem] md:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-abdu-gradient text-white">
          <Cookie size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="font-black">Cookies do YouTube</h2>
          <p className="mt-1 text-sm text-muted">
            Nessa tela de cookies, não use New/Import. Exporte e cole o
            conteúdo aqui (Netscape ou JSON).
          </p>
        </div>
      </div>

      <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-muted">
        <li>Fique em youtube.com já logado.</li>
        <li>
          Na extensão, procure <strong>Export</strong> / exportar — não o
          “New / Import”.
        </li>
        <li>
          Se pedir formato, escolha Netscape ou JSON. Copie tudo e cole abaixo.
        </li>
      </ol>

      <p className="mt-3 text-sm font-bold">
        Status:{" "}
        <span className={configured ? "text-coral" : "text-muted"}>
          {configured ? "cookies salvos neste servidor" : "ainda sem cookies"}
        </span>
      </p>

      <textarea
        value={cookies}
        onChange={(event) => setCookies(event.target.value)}
        rows={6}
        spellCheck={false}
        placeholder="Cole o export aqui (Netscape ou JSON)"
        className="mt-3 w-full rounded-2xl border border-line bg-background px-4 py-3 font-mono text-xs"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving || cookies.trim().length < 40}
          className="rounded-full bg-abdu-gradient px-5 py-2 text-sm font-black text-white disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar cookies"}
        </button>
        {configured ? (
          <button
            type="button"
            disabled={saving}
            onClick={remove}
            className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2 text-sm font-bold text-muted"
          >
            <Trash2 size={14} />
            Remover
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-sm font-bold text-coral">{error}</p> : null}
      {message ? <p className="mt-2 text-sm font-bold">{message}</p> : null}
    </form>
  );
}

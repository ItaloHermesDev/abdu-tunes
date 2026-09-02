import { EmptyState } from "@/components/library-extras";
import { TrackRow } from "@/components/track-row";
import { requireUser } from "@/lib/auth";
import { listAlbums, listTracks } from "@/lib/db";

export const metadata = { title: "Faixas soltas" };

export default async function TracksPage() {
  const user = await requireUser();
  const [tracks, albums] = await Promise.all([
    listTracks(user.profileId, { loose: true }),
    listAlbums(user.profileId),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-black md:text-4xl">Faixas soltas</h1>
        <p className="text-muted">Músicas sem álbum, prontas para tocar ou organizar.</p>
      </div>
      {tracks.length ? (
        <div className="rounded-[1.8rem] border border-line bg-surface p-2">
          {tracks.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              queue={tracks}
              albums={albums.map((album) => ({ id: album.id, title: album.title }))}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhuma faixa solta"
          text="Importe um MP3 e escolha o destino “deixar solta”."
          actionHref="/import"
          actionLabel="Importar"
        />
      )}
    </div>
  );
}

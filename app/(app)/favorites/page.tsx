import { EmptyState } from "@/components/library-extras";
import { TrackRow } from "@/components/track-row";
import { requireUser } from "@/lib/auth";
import { listAlbums, listTracks } from "@/lib/db";

export const metadata = { title: "Favoritos" };

export default async function FavoritesPage() {
  const user = await requireUser();
  const [tracks, albums] = await Promise.all([
    listTracks(user.profileId, { favorite: true }),
    listAlbums(user.profileId),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-4xl font-black">Favoritos</h1>
        <p className="text-muted">Tudo o que você marcou com coração.</p>
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
          title="Sem favoritos ainda"
          text="Toque uma faixa e toque o coração para guardar aqui."
        />
      )}
    </div>
  );
}

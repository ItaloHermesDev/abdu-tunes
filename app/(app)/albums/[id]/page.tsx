import { notFound } from "next/navigation";
import { EmptyState } from "@/components/library-extras";
import { TrackRow } from "@/components/track-row";
import { requireUser } from "@/lib/auth";
import { getAlbum, listAlbums, listTracks } from "@/lib/db";

export const metadata = { title: "Álbum" };

export default async function AlbumDetailPage({
  params,
}: PageProps<"/albums/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const album = await getAlbum(user.profileId, id);
  if (!album) notFound();

  const [tracks, albums] = await Promise.all([
    listTracks(user.profileId, { albumId: album.id }),
    listAlbums(user.profileId),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-6 md:flex-row">
        <div
          className="mx-auto h-40 w-40 overflow-hidden rounded-[2rem] bg-abdu-gradient bg-cover bg-center glow-abdu md:mx-0 md:h-56 md:w-56"
          style={{
            backgroundImage: album.coverUrl || tracks[0]?.coverUrl
              ? `url(${album.coverUrl || tracks[0]?.coverUrl})`
              : undefined,
          }}
        />
        <div className="flex flex-col justify-end text-center md:text-left">
          <p className="text-xs font-black tracking-[0.3em] text-muted">ÁLBUM</p>
          <h1 className="text-3xl font-black md:text-5xl">{album.title}</h1>
          <p className="mt-2 text-muted">
            {album.description || `${album.trackCount} faixas na sua biblioteca`}
          </p>
        </div>
      </div>
      {tracks.length ? (
        <div className="rounded-[1.8rem] border border-line bg-surface p-2">
          {tracks.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              queue={tracks}
              albums={albums.map((item) => ({ id: item.id, title: item.title }))}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Álbum vazio"
          text="Importe faixas do YouTube direto para este álbum."
          actionHref="/import"
          actionLabel="Importar"
        />
      )}
    </div>
  );
}

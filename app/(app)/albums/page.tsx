import { CreateAlbumForm, EmptyState } from "@/components/library-extras";
import { AlbumCard } from "@/components/album-card";
import { requireUser } from "@/lib/auth";
import { listAlbums, listTracks } from "@/lib/db";

export const metadata = { title: "Álbuns" };

export default async function AlbumsPage() {
  const user = await requireUser();
  const albums = await listAlbums(user.profileId);
  const items = await Promise.all(
    albums.map(async (album) => {
      const fallback = album.coverUrl
        ? null
        : (await listTracks(user.profileId, { albumId: album.id, limit: 1 }))[0];
      return {
        ...album,
        image: album.coverUrl || fallback?.coverUrl || null,
      };
    }),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black md:text-4xl">Álbuns</h1>
          <p className="text-muted">Playlists e discos da sua biblioteca.</p>
        </div>
        <CreateAlbumForm />
      </div>
      {items.length ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((album) => (
            <AlbumCard
              key={album.id}
              href={`/albums/${album.id}`}
              title={album.title}
              subtitle={`${album.trackCount} faixa${album.trackCount === 1 ? "" : "s"}`}
              image={album.image}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhum álbum ainda"
          text="Crie um álbum vazio ou importe uma playlist do YouTube."
          actionHref="/import"
          actionLabel="Importar playlist"
        />
      )}
    </div>
  );
}

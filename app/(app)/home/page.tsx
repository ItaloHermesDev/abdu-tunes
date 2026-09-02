import { AlbumCard } from "@/components/album-card";
import { TrackRow } from "@/components/track-row";
import { EmptyState } from "@/components/library-extras";
import { requireUser } from "@/lib/auth";
import { libraryStats, listAlbums, listTracks } from "@/lib/db";
import { FEATURED_ALBUMS, FEATURED_ARTISTS } from "@/lib/featured";

export const metadata = { title: "Início" };

export default async function HomePage() {
  const user = await requireUser();
  const [stats, albums, recent, favorites] = await Promise.all([
    libraryStats(user.profileId),
    listAlbums(user.profileId),
    listTracks(user.profileId, { limit: 8 }),
    listTracks(user.profileId, { favorite: true, limit: 6 }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <header>
        <p className="text-xs font-black tracking-[0.3em] text-muted">
          MUSIC. INDIA. EVERYWHERE.
        </p>
        <h1 className="mt-2 text-4xl font-black">Olá, {user.profileName.split(" ")[0]}</h1>
        <p className="text-muted">Biblioteca do perfil {user.profileName} — só o que é seu.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-4">
        {[
          ["Faixas", stats.tracks],
          ["Álbuns", stats.albums],
          ["Favoritos", stats.favorites],
          ["Soltas", stats.loose],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-line bg-surface p-4">
            <p className="text-sm text-muted">{label}</p>
            <p className="text-3xl font-black">{value}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-black">Recém importadas</h2>
        {recent.length ? (
          <div className="rounded-[1.8rem] border border-line bg-surface p-2">
            {recent.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                queue={recent}
                albums={albums.map((album) => ({ id: album.id, title: album.title }))}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sua biblioteca ainda está em silêncio"
            text="Cole um link do YouTube e transforme em MP3."
            actionHref="/import"
            actionLabel="Importar música"
          />
        )}
      </section>

      {favorites.length ? (
        <section>
          <h2 className="mb-4 text-2xl font-black">Favoritos</h2>
          <div className="rounded-[1.8rem] border border-line bg-surface p-2">
            {favorites.map((track) => (
              <TrackRow key={track.id} track={track} queue={favorites} />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-4 text-2xl font-black">Para você</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {FEATURED_ALBUMS.map((album) => (
            <AlbumCard
              key={album.title}
              title={album.title}
              subtitle={album.artist}
              image={album.image}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-black">Cards de artistas</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {FEATURED_ARTISTS.map((artist) => (
            <article
              key={artist.name}
              className="overflow-hidden rounded-[1.8rem] border border-line bg-surface"
            >
              <div
                className="h-48 bg-cover bg-center"
                style={{ backgroundImage: `url(${artist.image})` }}
              />
              <div className="p-4">
                <h3 className="font-extrabold">{artist.name}</h3>
                <p className="text-sm text-muted">{artist.role}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

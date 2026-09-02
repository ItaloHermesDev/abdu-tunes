import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { FEATURED_ALBUMS, FEATURED_ARTISTS } from "@/lib/featured";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/wordmark";
import { AlbumCard } from "@/components/album-card";
import { SoundWave } from "@/components/sound-wave";

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <div className="mandala-bg min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Wordmark withMark />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <Link
              href="/home"
              className="rounded-full bg-abdu-gradient px-5 py-2.5 font-black text-white"
            >
              Biblioteca
            </Link>
          ) : (
            <>
              <Link href="/login" className="font-bold">
                Entrar
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-abdu-gradient px-5 py-2.5 font-black text-white glow-abdu"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-10 md:grid-cols-2 md:py-16">
        <div>
          <p className="text-xs font-black tracking-[0.35em] text-muted">
            MUSIC. INDIA. EVERYWHERE.
          </p>
          <h1 className="mt-4 text-5xl font-black leading-[0.95] md:text-7xl">
            A Índia em
            <span className="text-abdu-gradient"> alta-fidelidade.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted">
            Abdu Tunes é o seu streaming pessoal: importe faixas e playlists do
            YouTube em MP3, organize álbuns, favoritos e toque tudo em uma
            interface premium.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={user ? "/import" : "/register"}
              className="rounded-full bg-abdu-gradient px-6 py-3 font-black text-white glow-abdu"
            >
              Começar agora
            </Link>
            <Link
              href={user ? "/home" : "/login"}
              className="rounded-full border border-line px-6 py-3 font-bold"
            >
              Entrar na biblioteca
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-6 rounded-[2.5rem] bg-abdu-gradient opacity-30 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2.5rem] border border-line bg-ink p-8 text-center">
            <Image
              src="/assets/piloto.png"
              alt="Abdu Tunes"
              width={420}
              height={420}
              className="mx-auto h-auto w-72"
              priority
            />
            <div className="mt-4 flex justify-center">
              <SoundWave />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl font-black">Capas da marca</h2>
          <span className="text-sm text-muted">Álbuns em destaque</span>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {FEATURED_ALBUMS.map((album) => (
            <AlbumCard
              key={album.title}
              title={album.title}
              subtitle={`${album.artist} · ${album.mood}`}
              image={album.image}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <h2 className="mb-5 text-2xl font-black">Artistas em destaque</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {FEATURED_ARTISTS.map((artist) => (
            <article
              key={artist.name}
              className="flex items-center gap-4 rounded-[1.8rem] border border-line bg-surface p-4"
            >
              <div className="relative h-20 w-20 overflow-hidden rounded-full">
                <Image src={artist.image} alt={artist.name} fill className="object-cover" sizes="80px" />
              </div>
              <div>
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

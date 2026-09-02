import Image from "next/image";
import Link from "next/link";
import { FEATURED_ALBUMS, FEATURED_ARTISTS } from "@/lib/featured";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/wordmark";
import { AlbumCard } from "@/components/album-card";
import { SoundWave } from "@/components/sound-wave";
import { Mandala } from "@/components/mandala";

const APPLICATIONS = [
  "Tela inicial",
  "Player",
  "Playlists",
  "Cards de artistas",
  "Capa de álbum",
  "Ícone do app",
  "Login",
  "Banner promocional",
  "Posts sociais",
  "Interface desktop",
];

export const metadata = { title: "Identidade visual" };

export default function IdentityPage() {
  return (
    <div className="mandala-bg min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/">
          <Wordmark withMark />
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className="rounded-full bg-abdu-gradient px-5 py-2 font-black text-white">
            Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-16 px-6 pb-20">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-line bg-ink p-8 text-white md:p-12">
          <Mandala className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 opacity-40" />
          <p className="text-xs font-black tracking-[0.35em] text-white/60">
            SISTEMA VISUAL
          </p>
          <h1 className="mt-3 max-w-3xl text-5xl font-black">
            Nota + play + mandala + gradiente laranja/magenta.
          </h1>
          <p className="mt-4 max-w-2xl text-white/70">
            Vibrante, moderna, cultural, tecnológica e premium. A Abdu Tunes
            mistura tradição indiana e streaming contemporâneo.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <article className="rounded-[1.8rem] border border-line bg-surface p-6">
            <h2 className="font-black">Paleta</h2>
            <div className="mt-4 flex h-16 overflow-hidden rounded-2xl">
              <div className="flex-1 bg-orange" />
              <div className="flex-1 bg-coral" />
              <div className="flex-1 bg-pink" />
              <div className="flex-1 bg-magenta" />
              <div className="flex-1 bg-navy" />
            </div>
            <p className="mt-3 text-sm text-muted">Laranja → Coral → Rosa → Magenta</p>
          </article>
          <article className="rounded-[1.8rem] border border-line bg-surface p-6">
            <h2 className="font-black">Tipografia</h2>
            <Wordmark className="mt-4" size="lg" />
            <p className="mt-3 text-sm text-muted">
              Nunito: sans-serif arredondada. Abdu em navy/branco, Tunes no gradiente.
            </p>
          </article>
          <article className="rounded-[1.8rem] border border-line bg-surface p-6">
            <h2 className="font-black">Personalidade</h2>
            <p className="mt-3 text-sm text-muted">
              Vibrante · Moderna · Cultural · Tecnológica · Divertida · Premium · Musical
            </p>
          </article>
        </section>

        <section>
          <h2 className="mb-4 text-3xl font-black">Aplicações da identidade</h2>
          <div className="mb-6 flex flex-wrap gap-2">
            {APPLICATIONS.map((item, index) => (
              <span key={item} className="rounded-full border border-line px-3 py-1 text-sm font-bold">
                {index + 1}. {item}
              </span>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <figure className="overflow-hidden rounded-[1.8rem] border border-line bg-surface">
              <Image src="/assets/brand/app-icon.png" alt="Ícone do aplicativo" width={800} height={800} />
              <figcaption className="p-4 font-bold">6. Ícone do aplicativo</figcaption>
            </figure>
            <figure className="overflow-hidden rounded-[1.8rem] border border-line bg-surface">
              <Image src="/assets/brand/banner-promocional.png" alt="Banner" width={1200} height={675} />
              <figcaption className="p-4 font-bold">8. Banner promocional</figcaption>
            </figure>
            <figure className="overflow-hidden rounded-[1.8rem] border border-line bg-surface">
              <Image src="/assets/brand/post-social.png" alt="Post social" width={800} height={800} />
              <figcaption className="p-4 font-bold">9. Post para redes</figcaption>
            </figure>
            <figure className="overflow-hidden rounded-[1.8rem] border border-line bg-surface">
              <Image src="/assets/brand/post-social-wide.png" alt="Post wide" width={1200} height={900} />
              <figcaption className="p-4 font-bold">9. Post paisagem</figcaption>
            </figure>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-3xl font-black">5. Capas de álbum</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {FEATURED_ALBUMS.map((album) => (
              <AlbumCard key={album.title} title={album.title} subtitle={album.artist} image={album.image} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-3xl font-black">4. Cards de artistas</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {FEATURED_ARTISTS.map((artist) => (
              <article key={artist.name} className="overflow-hidden rounded-[1.8rem] border border-line bg-surface">
                <div className="relative h-64">
                  <Image src={artist.image} alt={artist.name} fill className="object-cover" sizes="33vw" />
                </div>
                <div className="p-4">
                  <h3 className="font-extrabold">{artist.name}</h3>
                  <p className="text-sm text-muted">{artist.role}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-line bg-surface p-6">
          <h2 className="text-3xl font-black">2. Player de música</h2>
          <div className="mt-6 flex flex-col items-center gap-4 rounded-[1.8rem] bg-ink p-6 text-white">
            <div className="h-40 w-40 overflow-hidden rounded-[1.6rem]">
              <Image src="/assets/brand/capa-album-1.png" alt="" width={320} height={320} />
            </div>
            <p className="text-xl font-black">Raga Neon</p>
            <p className="text-sm text-white/60">Abdu Collective</p>
            <SoundWave />
            <div className="h-1 w-full max-w-md overflow-hidden rounded-full bg-white/15">
              <div className="h-full w-2/3 bg-abdu-gradient" />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Link href="/" className="rounded-[1.8rem] border border-line bg-surface p-5 font-bold">
            1. Tela inicial → abrir landing
          </Link>
          <Link href="/login" className="rounded-[1.8rem] border border-line bg-surface p-5 font-bold">
            7. Página de login
          </Link>
          <Link href="/home" className="rounded-[1.8rem] border border-line bg-surface p-5 font-bold">
            10. Interface desktop autenticada
          </Link>
        </section>
      </main>
    </div>
  );
}

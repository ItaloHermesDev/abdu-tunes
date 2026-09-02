import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/wordmark";
import { SoundWave } from "@/components/sound-wave";

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <div className="mandala-bg min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 md:px-6 md:py-5">
        <Wordmark withMark size="sm" className="md:hidden" />
        <Wordmark withMark className="hidden md:inline-flex" />
        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <ThemeToggle />
          {user ? (
            <Link
              href="/home"
              className="rounded-full bg-abdu-gradient px-4 py-2 text-sm font-black text-white md:px-5 md:py-2.5 md:text-base"
            >
              Biblioteca
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden font-bold sm:inline">
                Entrar
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-abdu-gradient px-4 py-2 text-sm font-black text-white glow-abdu md:px-5 md:py-2.5 md:text-base"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-8 pb-16 md:grid-cols-2 md:px-6 md:py-16 md:pb-20">
        <div>
          <p className="text-[10px] font-black tracking-[0.28em] text-muted md:text-xs md:tracking-[0.35em]">
            MUSIC. INDIA. EVERYWHERE.
          </p>
          <h1 className="mt-4 text-4xl font-black leading-[0.95] sm:text-5xl md:text-7xl">
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
    </div>
  );
}

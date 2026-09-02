import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export default function NotFound() {
  return (
    <div className="mandala-bg flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <Wordmark withMark />
      <h1 className="text-3xl font-black">Essa faixa não está na mix.</h1>
      <Link href="/" className="rounded-full bg-abdu-gradient px-5 py-2.5 font-black text-white">
        Voltar ao início
      </Link>
    </div>
  );
}

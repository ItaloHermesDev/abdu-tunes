import { ImportPanel } from "@/components/import-panel";
import { requireUser } from "@/lib/auth";
import { listAlbums } from "@/lib/db";

export const metadata = { title: "Importar" };

export default async function ImportPage() {
  const user = await requireUser();
  const albums = await listAlbums(user.profileId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-xs font-black tracking-[0.3em] text-muted">YOUTUBE → MP3</p>
        <h1 className="text-4xl font-black">Importar músicas</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Cole o link de um vídeo ou de uma playlist. Baixe uma faixa só ou a
          lista inteira, direto para um álbum ou como faixa solta.
        </p>
      </div>
      <ImportPanel albums={albums.map((album) => ({ id: album.id, title: album.title }))} />
    </div>
  );
}

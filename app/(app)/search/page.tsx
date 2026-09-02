import { SearchClient } from "@/components/search-client";
import { requireUser } from "@/lib/auth";
import { listAlbums, listTracks } from "@/lib/db";

export const metadata = { title: "Buscar" };

export default async function SearchPage() {
  const user = await requireUser();
  const [tracks, albums] = await Promise.all([
    listTracks(user.profileId),
    listAlbums(user.profileId),
  ]);
  return <SearchClient tracks={tracks} albums={albums} />;
}

export function formatDuration(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function mediaUrl(
  kind: "covers" | "audio" | "avatars",
  relativePath: string | null,
) {
  if (!relativePath) return null;
  const filename = relativePath.replace(/\\/g, "/").split("/").pop();
  if (!filename) return null;
  return `/api/media/${kind}/${filename}`;
}

export function isYouTubeUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.hostname.includes("youtube.com") ||
      url.hostname.includes("youtu.be") ||
      url.hostname.includes("music.youtube.com")
    );
  } catch {
    return false;
  }
}

export function looksLikePlaylist(value: string) {
  try {
    const url = new URL(value);
    return (
      url.pathname.startsWith("/playlist") ||
      url.searchParams.has("list")
    );
  } catch {
    return false;
  }
}

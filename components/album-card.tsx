"use client";

import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

export function AlbumCard({
  href,
  title,
  subtitle,
  image,
  onPlay,
}: {
  href?: string;
  title: string;
  subtitle: string;
  image: string | null;
  onPlay?: () => void;
}) {
  const content = (
    <article className="group relative overflow-hidden rounded-3xl border border-line bg-surface p-3 transition hover:-translate-y-1 hover:glow-abdu">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-abdu-gradient">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 20vw"
            unoptimized={image.startsWith("/api/")}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl text-white">♪</div>
        )}
        {onPlay ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              onPlay();
            }}
            className="absolute bottom-3 right-3 flex h-12 w-12 items-center justify-center rounded-full bg-abdu-gradient text-white opacity-0 shadow-lg transition group-hover:opacity-100"
            aria-label={`Tocar ${title}`}
          >
            <Play className="ml-0.5" size={20} />
          </button>
        ) : null}
      </div>
      <div className="px-1 pb-2 pt-3">
        <h3 className="truncate font-extrabold">{title}</h3>
        <p className="truncate text-sm text-muted">{subtitle}</p>
      </div>
    </article>
  );

  if (!href) return content;
  return (
    <Link href={href} className={cn("block")}>
      {content}
    </Link>
  );
}

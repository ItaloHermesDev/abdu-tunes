import Image from "next/image";
import { cn } from "@/lib/utils";

export function Wordmark({
  className,
  size = "md",
  withMark = false,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  withMark?: boolean;
}) {
  const text =
    size === "lg" ? "text-4xl md:text-5xl" : size === "sm" ? "text-lg" : "text-2xl";

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {withMark ? (
        <Image
          src="/assets/logo.png"
          alt=""
          width={size === "lg" ? 56 : size === "sm" ? 28 : 40}
          height={size === "lg" ? 56 : size === "sm" ? 28 : 40}
          className="h-auto w-auto rounded-full"
        />
      ) : null}
      <span className={cn("font-black tracking-tight", text)}>
        <span className="text-navy dark:text-white">Abdu </span>
        <span className="text-abdu-gradient">Tunes</span>
      </span>
    </span>
  );
}

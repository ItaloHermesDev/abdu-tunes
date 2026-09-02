import { cn } from "@/lib/utils";

export function SoundWave({
  active = true,
  className,
}: {
  active?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex h-6 items-end gap-[3px]", className)} aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={cn(
            "sound-bar w-[3px] rounded-full bg-abdu-gradient",
            i % 2 === 0 ? "h-5" : "h-3",
            !active && "animate-none opacity-50",
          )}
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  );
}

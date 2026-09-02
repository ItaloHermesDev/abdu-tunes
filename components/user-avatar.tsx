import Image from "next/image";

export function UserAvatar({
  src,
  name,
  size = 40,
}: {
  src: string | null;
  name: string;
  size?: number;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "A";
  return (
    <span
      className="relative inline-flex shrink-0 overflow-hidden rounded-full bg-abdu-gradient text-white"
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt={name} fill className="object-cover" unoptimized sizes={`${size}px`} />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center font-black"
          style={{ fontSize: size * 0.4 }}
        >
          {initial}
        </span>
      )}
    </span>
  );
}

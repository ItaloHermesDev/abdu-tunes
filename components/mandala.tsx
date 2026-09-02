export function Mandala({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="abdu-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF8A1F" />
          <stop offset="50%" stopColor="#FF4D6D" />
          <stop offset="100%" stopColor="#D4008F" />
        </linearGradient>
      </defs>
      <g stroke="url(#abdu-stroke)" strokeWidth="1.2" opacity="0.7">
        <circle cx="100" cy="100" r="28" />
        <circle cx="100" cy="100" r="46" />
        <circle cx="100" cy="100" r="68" />
        <circle cx="100" cy="100" r="86" />
        {Array.from({ length: 12 }).map((_, i) => (
          <ellipse
            key={i}
            cx="100"
            cy="52"
            rx="10"
            ry="22"
            transform={`rotate(${i * 30} 100 100)`}
          />
        ))}
      </g>
    </svg>
  );
}

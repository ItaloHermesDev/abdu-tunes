export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="h-10 w-48 animate-pulse rounded-full bg-surface-2" />
      <div className="h-40 animate-pulse rounded-[2rem] bg-surface-2" />
      <div className="h-64 animate-pulse rounded-[2rem] bg-surface-2" />
    </div>
  );
}

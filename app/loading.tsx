export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-4 w-36 animate-pulse rounded bg-surface-2" />
      <div className="mt-4 h-10 w-2/3 max-w-md animate-pulse rounded-xl bg-surface-2" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="aspect-[2/3] animate-pulse rounded-2xl border border-line bg-surface-2" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-surface-2" />
            <div className="h-2.5 w-3/5 animate-pulse rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

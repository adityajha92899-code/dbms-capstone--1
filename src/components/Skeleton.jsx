export function MovieCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[2/3] w-full" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}

export function MovieGridSkeleton({ count = 12 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-950 pt-20">
      <div className="skeleton h-[60vh] w-full" />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        <div className="skeleton h-10 w-2/3 rounded" />
        <div className="skeleton h-5 w-1/3 rounded" />
        <div className="space-y-2 mt-6">
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-5/6 rounded" />
          <div className="skeleton h-4 w-4/6 rounded" />
        </div>
      </div>
    </div>
  );
}

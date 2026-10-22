import { useRef } from "react";
import MovieCard from "./MovieCard";
import { MovieCardSkeleton } from "./Skeleton";

// Netflix-style horizontally scrolling row
export default function MovieRow({ title, movies, loading }) {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: "smooth" });

  return (
    <section className="group/row mb-12">
      <div className="flex items-end justify-between mb-4">
        <h2 className="section-title">{title}</h2>
        <div className="hidden sm:flex gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
          <button onClick={() => scroll(-1)} aria-label={`Scroll ${title} left`} className="btn-ghost !px-3 !py-1.5">‹</button>
          <button onClick={() => scroll(1)}  aria-label={`Scroll ${title} right`} className="btn-ghost !px-3 !py-1.5">›</button>
        </div>
      </div>
      <div ref={ref} className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="shrink-0 w-40 sm:w-44"><MovieCardSkeleton /></div>)
          : movies.map((m) => (
              <div key={m.id} className="shrink-0 w-40 sm:w-44 snap-start"><MovieCard movie={m} /></div>
            ))}
      </div>
    </section>
  );
}

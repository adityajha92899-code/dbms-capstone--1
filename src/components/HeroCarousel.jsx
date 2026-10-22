import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IMG_W1280 } from "../utils/constants";
import RatingRing from "./RatingRing";

const INTERVAL = 7000;

export default function HeroCarousel({ movies, onSurprise, surprising }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || movies.length < 2) return;
    const t = setTimeout(() => setI((n) => (n + 1) % movies.length), INTERVAL);
    return () => clearTimeout(t);
  }, [i, paused, movies.length]);

  if (!movies.length) return <div className="h-[80vh] skeleton rounded-none" />;
  const m = movies[i];

  return (
    <section
      className="relative h-[85vh] min-h-[520px] flex items-end overflow-hidden"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel" aria-label="Trending movies"
    >
      {/* Cross-fading backdrops with a slow Ken Burns zoom */}
      {movies.map((mv, idx) => (
        <img
          key={mv.id} src={`${IMG_W1280}${mv.backdrop_path}`} alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === i ? "opacity-100 animate-kenburns" : "opacity-0"}`}
          fetchpriority={idx === 0 ? "high" : "low"}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/30 to-transparent" />

      <div key={m.id} className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pb-20 animate-slide-up">
        <span className="badge bg-brand-500/20 text-brand-400 border border-brand-500/30 mb-4 inline-block">🔥 Trending #{i + 1} This Week</span>
        <h1 className="font-display text-6xl sm:text-8xl text-white mb-4 leading-[.9] max-w-3xl drop-shadow-2xl">{m.title}</h1>
        <div className="flex items-center gap-4 mb-4">
          <RatingRing value={m.vote_average} size={52} />
          <span className="text-zinc-300 text-sm">{m.release_date?.slice(0, 4)}</span>
          <span className="text-zinc-500 text-sm">{m.vote_count?.toLocaleString()} votes</span>
        </div>
        <p className="text-zinc-300 text-base max-w-xl mb-7 line-clamp-3">{m.overview}</p>
        <div className="flex gap-3 flex-wrap">
          <Link to={`/movie/${m.id}`} className="btn-primary !px-7 !py-3 text-base">▶ View Details</Link>
          <button onClick={onSurprise} disabled={surprising} className="btn-ghost !px-6 !py-3 text-base disabled:opacity-60">
            {surprising ? "Rolling…" : "🎲 Surprise Me"}
          </button>
        </div>
      </div>

      {/* Progress dots */}
      <div className="absolute z-10 bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {movies.map((mv, idx) => (
          <button key={mv.id} onClick={() => setI(idx)} aria-label={`Show ${mv.title}`}
            className={`h-1.5 rounded-full transition-all duration-500 ${idx === i ? "w-10 bg-brand-500" : "w-4 bg-white/30 hover:bg-white/60"}`} />
        ))}
      </div>
    </section>
  );
}

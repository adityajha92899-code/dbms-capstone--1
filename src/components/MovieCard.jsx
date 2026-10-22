import { memo } from "react";
import { Link } from "react-router-dom";
import { useFavorite } from "../hooks/useFavorites";
import { IMG_W500, PLACEHOLDER_POSTER } from "../utils/constants";
import RatingRing from "./RatingRing";

function MovieCard({ movie }) {
  const { isFavorite, toggle } = useFavorite(movie);
  const year       = movie.release_date?.slice(0, 4);
  const poster     = movie.poster_path ? `${IMG_W500}${movie.poster_path}` : PLACEHOLDER_POSTER;

  const toggleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  };

  return (
    <Link to={`/movie/${movie.id}`} className="card group block animate-fade-in" aria-label={movie.title}>
      <div className="relative overflow-hidden aspect-[2/3]">
        <img
          src={poster} alt="" loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => { e.currentTarget.src = PLACEHOLDER_POSTER; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Overview on hover */}
        {movie.overview && (
          <p className="absolute bottom-12 left-3 right-3 text-[11px] leading-snug text-zinc-200 line-clamp-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hidden sm:block">
            {movie.overview}
          </p>
        )}

        <button
          onClick={toggleFav}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={isFavorite}
          className="absolute top-2.5 right-2.5 w-9 h-9 flex items-center justify-center rounded-full bg-black/60 backdrop-blur border border-white/10 hover:border-brand-400 hover:scale-110 transition-all"
        >
          <span key={String(isFavorite)} className={isFavorite ? "animate-pop" : ""}>{isFavorite ? "❤️" : "🤍"}</span>
        </button>

        <div className="absolute bottom-2.5 left-2.5 group-hover:opacity-0 transition-opacity">
          <RatingRing value={movie.vote_average} size={40} />
        </div>

        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <span className="block text-center text-xs font-semibold bg-brand-500 text-white py-1.5 rounded-lg">View Details →</span>
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-sm font-semibold text-zinc-100 truncate leading-snug">{movie.title}</h3>
        <div className="flex items-center justify-between mt-1 text-xs text-zinc-500">
          <span>{year || "—"}</span>
          <span>{movie.vote_count > 1000 ? `${(movie.vote_count / 1000).toFixed(1)}k votes` : `${movie.vote_count ?? 0} votes`}</span>
        </div>
      </div>
    </Link>
  );
}

export default memo(MovieCard);

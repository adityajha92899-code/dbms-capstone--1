import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useFavorite } from "../hooks/useFavorites";
import Reviews from "../components/Reviews";
import { getMovieDetail } from "../utils/api";
import { IMG_W1280, IMG_W500, IMG_W200, PLACEHOLDER_POSTER, PLACEHOLDER_PERSON } from "../utils/constants";
import RatingRing from "../components/RatingRing";
import { DetailSkeleton } from "../components/Skeleton";
import MovieCard from "../components/MovieCard";

export default function MovieDetail() {
  const { id }      = useParams();
  const [movie,   setMovie]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const { isFavorite: isFav, toggle: toggleFav } = useFavorite(movie || { id: Number(id) });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMovieDetail(id);
      setMovie(res.data);
    } catch {
      setError("Could not load movie details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
  }, [load]);

  useEffect(() => {
    if (!trailerOpen) return;
    const onKey = (e) => e.key === "Escape" && setTrailerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [trailerOpen]);

  if (loading) return <DetailSkeleton />;
  if (error)   return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <p className="text-5xl mb-4">⚠️</p>
        <p className="text-zinc-400 mb-4">{error}</p>
        <button onClick={load} className="btn-primary mr-3">Retry</button>
        <Link to="/" className="btn-ghost">Go Home</Link>
      </div>
    </div>
  );

  const trailer = movie?.videos?.results?.find(
    (v) => v.type === "Trailer" && v.site === "YouTube"
  );
  const cast    = movie?.credits?.cast?.slice(0, 10) || [];
  const similar = movie?.similar?.results?.slice(0, 6) || [];
  const genres  = movie?.genres || [];
  const rating  = movie?.vote_average?.toFixed(1);
  const runtime = movie?.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : "N/A";

  const director = movie?.credits?.crew?.find((c) => c.job === "Director")?.name;


  return (
    <main className="min-h-screen bg-zinc-950">
      {/* BACKDROP */}
      <div className="relative h-[60vh] sm:h-[70vh] overflow-hidden">
        {movie.backdrop_path && (
          <img
            src={`${IMG_W1280}${movie.backdrop_path}`}
            alt={movie.title}
            className="w-full h-full object-cover animate-kenburns"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-zinc-950/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 to-transparent" />
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-72 relative z-10 pb-20">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="shrink-0 w-40 sm:w-56 mx-auto md:mx-0">
            <img
              src={movie.poster_path ? `${IMG_W500}${movie.poster_path}` : PLACEHOLDER_POSTER}
              alt={movie.title}
              className="w-full rounded-2xl border border-white/10 shadow-2xl shadow-brand-500/20"
            />
          </div>

          {/* Info */}
          <div className="flex-1 animate-fade-in">
            <div className="flex flex-wrap gap-2 mb-3">
              {genres.map((g) => (
                <span key={g.id} className="badge bg-white/5 backdrop-blur text-zinc-200 border border-white/10">{g.name}</span>
              ))}
            </div>

            <h1 className="font-display text-5xl sm:text-7xl text-white mb-1 leading-none">{movie.title}</h1>
            {movie.tagline && (
              <p className="text-zinc-400 italic text-sm mb-4">"{movie.tagline}"</p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4 text-sm mb-6">
              <RatingRing value={movie.vote_average} size={48} />
              <span className="text-zinc-400">{movie.release_date?.slice(0, 4)}</span>
              <span className="text-zinc-400">🕐 {runtime}</span>
              <span className="text-zinc-400">🗳️ {movie.vote_count?.toLocaleString()} votes</span>
              {director && <span className="text-zinc-400">🎥 Dir. <span className="text-zinc-200">{director}</span></span>}
            </div>

            <p className="text-zinc-300 text-sm leading-relaxed mb-6 max-w-2xl">{movie.overview}</p>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {trailer && (
                <button onClick={() => setTrailerOpen(true)} className="btn-primary">
                  ▶ Watch Trailer
                </button>
              )}
              <button onClick={toggleFav} aria-pressed={isFav} className={`btn-ghost ${isFav ? "!border-red-500 !text-red-400" : ""}`}>
                {isFav ? "❤️ Saved" : "🤍 Add to Favorites"}
              </button>
            </div>
          </div>
        </div>

        {/* CAST */}
        {cast.length > 0 && (
          <section className="mt-14">
            <h2 className="section-title mb-6">CAST</h2>
            <div className="flex gap-4 overflow-x-auto pb-3 no-scrollbar">
              {cast.map((person) => (
                <div key={person.id} className="shrink-0 w-24 text-center group">
                  <img
                    src={person.profile_path ? `${IMG_W200}${person.profile_path}` : PLACEHOLDER_PERSON}
                    alt={person.name}
                    loading="lazy"
                    className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-zinc-700 group-hover:border-brand-500 group-hover:scale-110 transition-all mb-2"
                  />
                  <p className="text-xs text-zinc-300 font-medium truncate">{person.name}</p>
                  <p className="text-xs text-zinc-600 truncate">{person.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <Reviews movie={movie} />

        {/* SIMILAR */}
        {similar.length > 0 && (
          <section className="mt-14">
            <h2 className="section-title mb-6">SIMILAR MOVIES</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {similar.map((m) => (
                <MovieCard key={m.id} movie={m} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* TRAILER MODAL */}
      {trailerOpen && trailer && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setTrailerOpen(false)}
        >
          <div
            className="w-full max-w-4xl aspect-video rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
              title="Trailer"
              allow="autoplay; fullscreen"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
          <button
            onClick={() => setTrailerOpen(false)}
            className="absolute top-4 right-4 text-white text-3xl hover:text-brand-400"
          >
            ✕
          </button>
        </div>
      )}
    </main>
  );
}

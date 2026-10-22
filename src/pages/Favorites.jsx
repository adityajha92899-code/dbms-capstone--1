import { useDispatch, useSelector } from "react-redux";
import { clearFavorites, selectFavorites } from "../redux/favoritesSlice";
import MovieCard from "../components/MovieCard";
import { Link } from "react-router-dom";

export default function Favorites() {
  const dispatch   = useDispatch();
  const favorites  = useSelector(selectFavorites);

  return (
    <main className="min-h-screen bg-zinc-950 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-5xl sm:text-6xl text-gradient">MY FAVORITES</h1>
            <p className="text-zinc-500 text-sm mt-1">{favorites.length} movie{favorites.length !== 1 ? "s" : ""} saved</p>
          </div>
          {favorites.length > 0 && (
            <button
              onClick={() => { if (window.confirm("Clear all favorites?")) dispatch(clearFavorites()); }}
              className="btn-ghost text-red-400 border-red-400/30 hover:border-red-400 text-sm"
            >
              🗑️ Clear All
            </button>
          )}
        </div>

        {/* Empty State */}
        {favorites.length === 0 && (
          <div className="text-center py-28">
            <p className="text-7xl mb-6">🤍</p>
            <h2 className="font-display text-4xl text-zinc-500 mb-3">NO FAVORITES YET</h2>
            <p className="text-zinc-600 text-sm mb-8">Start adding movies you love!</p>
            <Link to="/" className="btn-primary">Browse Movies</Link>
          </div>
        )}

        {/* Grid */}
        {favorites.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-fade-in">
            {favorites.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

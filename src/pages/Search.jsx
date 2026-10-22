import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchSearch, fetchDiscover, setPage } from "../redux/moviesSlice";
import { useDebounce } from "../hooks/useDebounce";
import MovieCard from "../components/MovieCard";
import { MovieGridSkeleton } from "../components/Skeleton";
import FilterBar from "../components/FilterBar";
import Pagination from "../components/Pagination";

export default function Search() {
  const dispatch      = useDispatch();
  const [params]      = useSearchParams();
  const urlQuery      = params.get("q") || "";
  const [input, setInput] = useState(urlQuery);
  const debounced     = useDebounce(input, 500);

  const { searchResults, status, error, currentPage, totalPages, totalResults, filters } =
    useSelector((s) => s.movies);

  // FIX: this effect used to dispatch setQuery(), which resets currentPage to 1 —
  // so paginating a text search bounced you straight back to page 1.
  useEffect(() => {
    const req = debounced.trim()
      ? dispatch(fetchSearch({ query: debounced.trim(), page: currentPage }))
      : dispatch(fetchDiscover({ ...filters, page: currentPage }));
    return () => req.abort(); // cancel in-flight request when inputs change
  }, [debounced, currentPage, filters, dispatch]);

  // Don't carry page 7 of a previous visit into a fresh visit
  useEffect(() => () => { dispatch(setPage(1)); }, [dispatch]);

  // Sync URL query
  useEffect(() => {
    if (urlQuery) setInput(urlQuery);
  }, [urlQuery]);

  const isLoading = status === "loading";

  return (
    <main className="min-h-screen bg-zinc-950 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-5xl sm:text-6xl mb-6"><span className="text-gradient">DISCOVER</span> <span className="text-white">MOVIES</span></h1>

          {/* Search Input */}
          <div className="relative mb-6">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg">🔍</span>
            <input
              value={input}
              onChange={(e) => { setInput(e.target.value); dispatch(setPage(1)); }}
              placeholder="Search for any movie..."
              className="input !text-base !pl-12 !pr-10 !py-4 !rounded-xl"
              autoFocus
            />
            {input && (
              <button
                aria-label="Clear search"
                onClick={() => setInput("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-lg"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters (only show when no search query) */}
          {!debounced.trim() && <FilterBar />}

          {/* Results count */}
          {!isLoading && totalResults > 0 && (
            <p className="text-zinc-500 text-sm mt-4">
              {totalResults.toLocaleString()} results {debounced ? `for "${debounced}"` : ""}
              {" · "} Page {currentPage} of {Math.min(totalPages, 500)}
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">⚠️</p>
            <p className="text-zinc-400">{error}</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && <MovieGridSkeleton count={12} />}

        {/* Results */}
        {!isLoading && !error && searchResults.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {searchResults.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} />
          </>
        )}

        {/* Empty */}
        {!isLoading && !error && searchResults.length === 0 && (
          <div className="text-center py-24">
            <p className="text-6xl mb-4">🎭</p>
            <h2 className="font-display text-3xl text-zinc-400 mb-2">NO RESULTS FOUND</h2>
            <p className="text-zinc-600 text-sm">Try a different search or adjust your filters.</p>
          </div>
        )}
      </div>
    </main>
  );
}

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import HeroCarousel from "../components/HeroCarousel";
import MovieRow from "../components/MovieRow";
import { getTrending, getPopular, getTopRated, getUpcoming, getRandomMovie } from "../utils/api";

const ROWS = [
  { key: "trending", title: "TRENDING NOW", fn: getTrending },
  { key: "popular",  title: "POPULAR",      fn: getPopular  },
  { key: "top",      title: "TOP RATED",    fn: getTopRated },
  { key: "upcoming", title: "COMING SOON",  fn: getUpcoming },
];

export default function Home() {
  const navigate = useNavigate();
  const [data, setData]       = useState({});
  const [loading, setLoading] = useState(true);
  const [failed, setFailed]   = useState(false);
  const [surprising, setSurprising] = useState(false);

  const load = async () => {
    setLoading(true); setFailed(false);
    // Fetch all four rows in parallel; one failing row shouldn't blank the page
    const results = await Promise.allSettled(ROWS.map((r) => r.fn()));
    const next = {};
    results.forEach((r, i) => { if (r.status === "fulfilled") next[ROWS[i].key] = r.value.data.results; });
    setData(next);
    setFailed(Object.keys(next).length === 0);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const surprise = async () => {
    setSurprising(true);
    try { const m = await getRandomMovie(); if (m) navigate(`/movie/${m.id}`); }
    finally { setSurprising(false); }
  };

  const heroMovies = (data.trending || []).filter((m) => m.backdrop_path).slice(0, 5);

  return (
    <main className="min-h-screen bg-zinc-950">
      <HeroCarousel movies={heroMovies} onSurprise={surprise} surprising={surprising} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-16 -mt-6 relative z-10">
        {failed ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">⚠️</p>
            <p className="text-zinc-400 mb-4">Failed to load movies. Check your TMDB API key in <code className="text-brand-400">.env</code>.</p>
            <button onClick={load} className="btn-primary">Retry</button>
          </div>
        ) : (
          ROWS.map((r) => <MovieRow key={r.key} title={r.title} movies={data[r.key] || []} loading={loading} />)
        )}

        {!loading && !failed && (
          <div className="text-center">
            <Link to="/search" className="btn-ghost text-base px-8 py-3">Explore All Movies →</Link>
          </div>
        )}
      </div>
    </main>
  );
}

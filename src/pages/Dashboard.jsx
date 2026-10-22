import { useMemo } from "react";
import { useSelector } from "react-redux";
import { selectFavorites } from "../redux/favoritesSlice";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import { Link } from "react-router-dom";
import { GENRE_NAMES, IMG_W200, PLACEHOLDER_PERSON } from "../utils/constants";

const COLORS = ["#e50000","#ff4444","#ff7700","#ffaa00","#ffdd00","#88dd00","#00cc44","#00aacc","#0055ff","#aa00ff","#ff00aa","#ff0055","#00ffdd"];

const genreMap = GENRE_NAMES;

// Fun "taste persona" derived from your top genre
const PERSONAS = {
  "Action": "Adrenaline Junkie", "Adventure": "Born Explorer", "Animation": "Big Kid at Heart", "Comedy": "Chief Laugh Officer",
  "Crime": "Armchair Detective", "Documentary": "Curious Mind", "Drama": "Emotional Powerhouse", "Fantasy": "Realm Wanderer",
  "Horror": "Fear Connoisseur", "Mystery": "Plot-Twist Hunter", "Romance": "Hopeless Romantic", "Sci-Fi": "Future Dreamer",
  "Thriller": "Edge-of-Seat Addict", "Family": "Cozy Couch Captain", "History": "Time Traveller", "Music": "Soundtrack Soul",
  "War": "Epic Storyteller", "Western": "Lone Rider",
};

const tooltipStyle = { background: "#18181b", border: "1px solid #3f3f46", color: "#f4f4f5", borderRadius: 8 };

export default function Dashboard() {
  const favorites = useSelector(selectFavorites);

  const stats = useMemo(() => {
    if (!favorites.length) return null;

    // Genre distribution
    const genreCounts = {};
    favorites.forEach((m) => {
      (m.genre_ids || []).forEach((gid) => {
        const name = genreMap[gid] || "Other";
        genreCounts[name] = (genreCounts[name] || 0) + 1;
      });
    });
    const genreData = Object.entries(genreCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Rating distribution
    const ratingBuckets = { "9-10": 0, "7-8.9": 0, "5-6.9": 0, "0-4.9": 0 };
    favorites.forEach((m) => {
      const r = m.vote_average || 0;
      if (r >= 9) ratingBuckets["9-10"]++;
      else if (r >= 7) ratingBuckets["7-8.9"]++;
      else if (r >= 5) ratingBuckets["5-6.9"]++;
      else ratingBuckets["0-4.9"]++;
    });
    const ratingData = Object.entries(ratingBuckets).map(([name, count]) => ({ name, count }));

    // Decade distribution (readable even with 50+ favourites)
    const decadeCounts = {};
    favorites.forEach((m) => {
      const y = parseInt(m.release_date?.slice(0, 4), 10);
      const d = y ? `${Math.floor(y / 10) * 10}s` : "Unknown";
      decadeCounts[d] = (decadeCounts[d] || 0) + 1;
    });
    const yearData = Object.entries(decadeCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, count]) => ({ year, count }));

    // Top rated
    const topRated = [...favorites].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0)).slice(0, 5);

    // Averages
    const avgRating = (favorites.reduce((s, m) => s + (m.vote_average || 0), 0) / favorites.length).toFixed(1);

    const persona = genreData[0] ? PERSONAS[genreData[0].name] || "Movie Buff" : "Movie Buff";
    return { genreData, ratingData, yearData, topRated, avgRating, persona };
  }, [favorites]);

  if (!favorites.length) {
    return (
      <main className="min-h-screen bg-zinc-950 pt-24 pb-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-7xl mb-6">📊</p>
          <h1 className="font-display text-4xl text-white mb-3">NO DATA YET</h1>
          <p className="text-zinc-500 text-sm mb-8">Save some favorites to see your dashboard come alive.</p>
          <Link to="/" className="btn-primary">Browse Movies</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Persona banner */}
        <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 mb-10 border border-white/10 bg-gradient-to-br from-brand-900 via-zinc-900 to-zinc-950">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-brand-500/30 rounded-full blur-3xl" />
          <p className="relative text-xs uppercase tracking-[.3em] text-brand-400 mb-2">Your taste profile</p>
          <h1 className="relative font-display text-6xl sm:text-8xl text-gradient leading-none">{stats.persona}</h1>
          <p className="relative text-zinc-400 text-sm mt-4 max-w-lg">
            Based on your {favorites.length} saved movies{stats.genreData[0] && <> — you lean hard into <b className="text-white">{stats.genreData[0].name}</b></>}.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total Saved",     value: favorites.length,       icon: "🎬" },
            { label: "Avg Rating",      value: `⭐ ${stats.avgRating}`, icon: "🌟" },
            { label: "Genres Explored", value: stats.genreData.length,  icon: "🎭" },
            { label: "Decades Covered",    value: stats.yearData.length,   icon: "📅" },
          ].map((kpi) => (
            <div key={kpi.label} className="glass rounded-2xl p-5 text-center hover:border-brand-500/50 transition-colors">
              <p className="text-3xl mb-2">{kpi.icon}</p>
              <p className="font-display text-4xl text-white">{kpi.value}</p>
              <p className="text-zinc-500 text-xs mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Genre Pie */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-4">Genre Breakdown</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={stats.genreData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} paddingAngle={3}>
                  {stats.genreData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2">
              {stats.genreData.map((g, i) => (
                <span key={g.name} className="text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-zinc-400">{g.name} ({g.value})</span>
                </span>
              ))}
            </div>
          </div>

          {/* Rating Bar */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-4">Rating Distribution</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.ratingData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#e50000" radius={[6, 6, 0, 0]} name="Movies" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Year Timeline + Top Rated */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Year */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-4">Movies by Decade</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.yearData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="year" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#ff4444" radius={[4, 4, 0, 0]} name="Movies" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Rated */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-4">Your Top Rated</h2>
            <div className="space-y-3">
              {stats.topRated.map((m, i) => (
                <Link
                  key={m.id}
                  to={`/movie/${m.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <span className="font-display text-2xl text-brand-500 w-7 shrink-0">#{i + 1}</span>
                  <img
                    src={m.poster_path ? `${IMG_W200}${m.poster_path}` : PLACEHOLDER_PERSON}
                    alt={m.title}
                    className="w-8 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 truncate font-medium">{m.title}</p>
                    <p className="text-xs text-zinc-500">{m.release_date?.slice(0, 4)}</p>
                  </div>
                  <span className="text-yellow-400 text-sm font-semibold shrink-0">⭐ {m.vote_average?.toFixed(1)}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

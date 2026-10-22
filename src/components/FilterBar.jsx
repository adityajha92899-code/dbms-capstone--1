import { useDispatch, useSelector } from "react-redux";
import { setFilters } from "../redux/moviesSlice";
import { GENRES, SORT_OPTIONS } from "../utils/constants";

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => currentYear - i);

export default function FilterBar() {
  const dispatch = useDispatch();
  const filters  = useSelector((s) => s.movies.filters);

  const update = (key, value) => dispatch(setFilters({ [key]: value }));

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Genre chips */}
      <div className="w-full flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {[{ id: "", name: "All" }, ...GENRES].map((g) => (
          <button
            key={g.id} onClick={() => update("genre", String(g.id))}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              String(filters.genre) === String(g.id)
                ? "bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/30"
                : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:border-brand-400"}`}
          >{g.name}</button>
        ))}
      </div>

      {/* Sort */}
      <select
        value={filters.sort}
        onChange={(e) => update("sort", e.target.value)}
        className="input w-auto min-w-[150px] text-sm cursor-pointer"
      >
        {SORT_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {/* Year */}
      <select
        value={filters.year}
        onChange={(e) => update("year", e.target.value)}
        className="input w-auto min-w-[110px] text-sm cursor-pointer"
      >
        <option value="">Any Year</option>
        {YEARS.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      {/* Clear */}
      {(filters.genre || filters.year || filters.sort !== "popularity.desc") && (
        <button
          onClick={() => dispatch(setFilters({ genre: "", sort: "popularity.desc", year: "" }))}
          className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors"
        >
          ✕ Clear Filters
        </button>
      )}
    </div>
  );
}

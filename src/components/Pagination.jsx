import { useDispatch } from "react-redux";
import { setPage } from "../redux/moviesSlice";

export default function Pagination({ currentPage, totalPages }) {
  const dispatch = useDispatch();

  if (totalPages <= 1) return null;

  const maxPages   = Math.min(totalPages, 500); // TMDB caps at 500
  const pageWindow = 2;
  const pages      = [];

  for (
    let i = Math.max(1, currentPage - pageWindow);
    i <= Math.min(maxPages, currentPage + pageWindow);
    i++
  ) {
    pages.push(i);
  }

  const go = (page) => {
    dispatch(setPage(page));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
      <button
        onClick={() => go(1)}
        disabled={currentPage === 1}
        className="btn-ghost px-3 py-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
      >
        «
      </button>
      <button
        onClick={() => go(currentPage - 1)}
        disabled={currentPage === 1}
        className="btn-ghost px-3 py-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ‹
      </button>

      {pages[0] > 1 && (
        <>
          <button onClick={() => go(1)} className="btn-ghost px-3 py-2 text-sm">1</button>
          {pages[0] > 2 && <span className="text-zinc-600 px-1">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => go(p)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            p === currentPage
              ? "bg-brand-500 text-white"
              : "btn-ghost"
          }`}
        >
          {p}
        </button>
      ))}

      {pages[pages.length - 1] < maxPages && (
        <>
          {pages[pages.length - 1] < maxPages - 1 && <span className="text-zinc-600 px-1">…</span>}
          <button onClick={() => go(maxPages)} className="btn-ghost px-3 py-2 text-sm">{maxPages}</button>
        </>
      )}

      <button
        onClick={() => go(currentPage + 1)}
        disabled={currentPage >= maxPages}
        className="btn-ghost px-3 py-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ›
      </button>
      <button
        onClick={() => go(maxPages)}
        disabled={currentPage >= maxPages}
        className="btn-ghost px-3 py-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
      >
        »
      </button>
    </div>
  );
}

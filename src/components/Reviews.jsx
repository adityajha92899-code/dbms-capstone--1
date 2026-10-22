import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { server, errMsg } from "../utils/server";

export default function Reviews({ movie }) {
  const { user } = useAuth();
  const [data, setData] = useState({ stats: {}, reviews: [] });
  const [rating, setRating] = useState(8);
  const [body, setBody] = useState("");
  const [editing, setEditing] = useState(null);       // review being edited (keeps its `version`)
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    try { setData((await server.get(`/movies/${movie.id}/reviews`)).data); setOffline(false); }
    catch { setOffline(true); }
  }, [movie.id]);
  useEffect(() => { load(); }, [load]);

  const mine = user && data.reviews.find((r) => r.userId === user.id);

  const submit = async (e) => {
    e.preventDefault(); setError("");
    try {
      if (editing) await server.put(`/reviews/${editing.id}`, { rating, body, version: editing.version });
      else await server.post(`/movies/${movie.id}/reviews`, { rating, body, movie });
      setEditing(null); setBody(""); await load();
    } catch (err) { setError(errMsg(err)); if (err?.response?.status === 409) load(); }
  };
  const remove = async (id) => { try { await server.delete(`/reviews/${id}`); await load(); } catch (err) { setError(errMsg(err)); } };
  const startEdit = (r) => { setEditing(r); setRating(r.rating); setBody(r.body); };

  const { avg_rating, review_count } = data.stats || {};

  return (
    <section className="mt-14">
      <div className="flex items-end justify-between flex-wrap gap-2 mb-6">
        <h2 className="section-title">COMMUNITY REVIEWS</h2>
        {review_count > 0 && <p className="text-sm text-zinc-400"><span className="text-yellow-400 font-bold text-lg">⭐ {avg_rating}</span> from {review_count} review{review_count > 1 ? "s" : ""}</p>}
      </div>

      {offline && <p className="text-sm text-zinc-500 mb-4">Reviews are unavailable — start the backend server (<code>npm run dev</code> in <code>/server</code>).</p>}

      {!offline && !user && (
        <p className="glass rounded-xl p-4 text-sm text-zinc-400 mb-6"><Link to="/login" state={{ from: `/movie/${movie.id}` }} className="text-brand-400 font-semibold">Sign in</Link> to write a review.</p>
      )}

      {user && (!mine || editing) && (
        <form onSubmit={submit} className="glass rounded-xl p-4 mb-6 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm text-zinc-400" htmlFor="rating">Your rating</label>
            <input id="rating" type="range" min="1" max="10" value={rating} onChange={(e) => setRating(+e.target.value)} className="accent-brand-500 w-40" />
            <span className="font-display text-2xl text-yellow-400 w-8">{rating}</span>
          </div>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={3} placeholder="What did you think?" className="input resize-none" aria-label="Review text" />
          {error && <p role="alert" className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button className="btn-primary">{editing ? "Save changes" : "Post review"}</button>
            {editing && <button type="button" className="btn-ghost" onClick={() => { setEditing(null); setBody(""); }}>Cancel</button>}
          </div>
        </form>
      )}

      <ul className="space-y-3">
        {data.reviews.map((r) => (
          <li key={r.id} className="glass rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-zinc-200">{r.author} {r.premium === 1 && <span title="Premium member" className="badge bg-amber-500/20 text-amber-300 border border-amber-500/30 ml-1">✨ Premium</span>}</p>
              <span className="text-yellow-400 font-bold text-sm">⭐ {r.rating}/10</span>
            </div>
            {r.body && <p className="text-sm text-zinc-300 mt-2 whitespace-pre-line">{r.body}</p>}
            <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
              <span>{new Date(r.createdAt).toLocaleDateString()}</span>
              {user && r.userId === user.id && <button onClick={() => startEdit(r)} className="hover:text-brand-400">Edit</button>}
              {user && (r.userId === user.id || user.role === "admin") && <button onClick={() => remove(r.id)} className="hover:text-red-400">Delete</button>}
            </div>
          </li>
        ))}
        {!offline && data.reviews.length === 0 && <p className="text-sm text-zinc-600">No reviews yet — be the first.</p>}
      </ul>
    </section>
  );
}

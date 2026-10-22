import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { server, errMsg } from "../utils/server";

const ago = (d) => { const s = (Date.now() - new Date(d)) / 1000; return s < 3600 ? `${Math.max(1, Math.floor(s / 60))}m` : s < 86400 ? `${Math.floor(s / 3600)}h` : `${Math.floor(s / 86400)}d`; };

function Post({ post, user, onChange, onDelete }) {
  const [comment, setComment] = useState("");
  const [open, setOpen] = useState(false);
  const like = async () => user && onChange((await server.post(`/feed/${post.id}/like`)).data);
  const send = async (e) => { e.preventDefault(); if (!comment.trim()) return; onChange((await server.post(`/feed/${post.id}/comments`, { text: comment })).data); setComment(""); };
  return (
    <article className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-zinc-200">{post.userName} <span className="text-zinc-600 font-normal">· {ago(post.createdAt)}</span></span>
        {user && (user.id === post.userId || user.role === "admin") && <button onClick={() => onDelete(post.id)} className="text-xs text-zinc-600 hover:text-red-400">Delete</button>}
      </div>
      {post.movieId && <Link to={`/movie/${post.movieId}`} className="badge bg-brand-500/15 text-brand-400 border border-brand-500/30 inline-block mt-2">🎬 {post.movieTitle}</Link>}
      <p className="text-zinc-300 mt-2 whitespace-pre-line">{post.text}</p>
      <div className="flex gap-4 mt-3 text-sm">
        <button onClick={like} disabled={!user} className={`transition-colors ${post.liked ? "text-red-400" : "text-zinc-500 hover:text-red-400"} disabled:cursor-not-allowed`}>{post.liked ? "❤️" : "🤍"} {post.likeCount}</button>
        <button onClick={() => setOpen((o) => !o)} className="text-zinc-500 hover:text-white">💬 {post.comments.length}</button>
      </div>
      {open && (
        <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
          {post.comments.map((c) => <p key={c.id} className="text-sm"><span className="font-semibold text-zinc-300">{c.userName}</span> <span className="text-zinc-400">{c.text}</span></p>)}
          {user && <form onSubmit={send} className="flex gap-2"><input value={comment} onChange={(e) => setComment(e.target.value)} maxLength={300} placeholder="Add a comment…" className="input !py-1.5" aria-label="Comment" /><button className="btn-ghost !py-1.5">Send</button></form>}
        </div>
      )}
    </article>
  );
}

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([server.get("/feed"), server.get("/feed/trending")]);
      setPosts(a.data); setTrending(b.data); setOffline(false);
    } catch (e) { setOffline(true); setError(errMsg(e)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const publish = async (e) => {
    e.preventDefault(); setError("");
    try { const { data } = await server.post("/feed", { text }); setPosts((p) => [data, ...p]); setText(""); }
    catch (err) { setError(errMsg(err)); }
  };
  const replace = (p) => setPosts((list) => list.map((x) => (x.id === p.id ? p : x)));
  const remove = async (id) => { await server.delete(`/feed/${id}`); setPosts((l) => l.filter((x) => x.id !== id)); };

  return (
    <main className="min-h-screen bg-zinc-950 pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <h1 className="font-display text-5xl sm:text-6xl text-gradient">COMMUNITY FEED</h1>
          {user ? (
            <form onSubmit={publish} className="glass rounded-2xl p-4 space-y-3">
              <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={500} rows={3} placeholder="Share a thought about a movie…" className="input resize-none" aria-label="New post" />
              <div className="flex items-center justify-between"><span className="text-xs text-zinc-600">{text.length}/500</span><button disabled={!text.trim()} className="btn-primary disabled:opacity-50">Post</button></div>
              {error && <p role="alert" className="text-red-400 text-xs">{error}</p>}
            </form>
          ) : <p className="glass rounded-xl p-4 text-sm text-zinc-400"><Link to="/login" state={{ from: "/feed" }} className="text-brand-400 font-semibold">Sign in</Link> to post, like and comment.</p>}

          {offline && <p className="text-sm text-zinc-500">{error || "Feed unavailable."} <span className="block mt-1">Set <code>MONGO_URI</code> in <code>server/.env</code> (MongoDB Atlas) and run <code>npm run mongo:seed</code>.</span></p>}
          {posts.map((p) => <Post key={p.id} post={p} user={user} onChange={replace} onDelete={remove} />)}
        </div>

        <aside className="md:pt-24">
          <div className="glass rounded-2xl p-5 sticky top-24">
            <h2 className="section-title !text-2xl mb-4">TRENDING</h2>
            {trending.length === 0 ? <p className="text-sm text-zinc-600">Nothing yet.</p> : (
              <ol className="space-y-3">
                {trending.map((t, i) => (
                  <li key={t.movieId}><Link to={`/movie/${t.movieId}`} className="flex gap-3 items-center hover:text-brand-400 transition-colors">
                    <span className="font-display text-2xl text-brand-500 w-6">{i + 1}</span>
                    <span className="min-w-0"><span className="block text-sm text-zinc-200 truncate">{t.title}</span><span className="text-xs text-zinc-600">{t.posts} posts · {t.likes} likes · {t.comments} comments</span></span>
                  </Link></li>
                ))}
              </ol>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

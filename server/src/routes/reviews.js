import { Router } from "express";
import { q, pool, withTx } from "../db.js";
import { auth, optionalAuth, asyncH, int, str, HttpError } from "../middleware.js";
import { upsertMovie } from "../movies.js";

const r = Router();

r.get("/movies/:id/reviews", optionalAuth, asyncH(async (req, res) => {
  const id = int(req.params.id, 1, 1e9, "Movie id");
  const [stats] = await q("SELECT review_count, avg_rating, watchlist_count FROM v_movie_stats WHERE movie_id=?", [id]);
  const reviews = await q(
    `SELECT r.review_id AS id, r.user_id AS userId, u.name AS author, fn_is_premium(r.user_id) AS premium,
            r.rating, r.body, r.version, r.created_at AS createdAt
     FROM reviews r JOIN users u USING (user_id) WHERE r.movie_id=? ORDER BY r.created_at DESC LIMIT 50`, [id]);
  res.json({ stats: stats || { review_count: 0, avg_rating: null, watchlist_count: 0 }, reviews });
}));

r.post("/movies/:id/reviews", auth, asyncH(async (req, res) => {
  const id = int(req.params.id, 1, 1e9, "Movie id");
  const rating = int(req.body.rating, 1, 10, "Rating");
  const body = typeof req.body.body === "string" ? req.body.body.trim().slice(0, 2000) : "";
  await withTx(async (conn) => {
    if (!(await upsertMovie(conn, { ...req.body.movie, id }))) throw new HttpError(400, "Invalid movie.");
    await conn.execute("INSERT INTO reviews (user_id,movie_id,rating,body) VALUES (?,?,?,?)", [req.user.id, id, rating, body]);
  });
  res.status(201).json({ ok: true });
}));

// OPTIMISTIC LOCKING: the client sends the version it loaded. If someone changed the row
// meanwhile, `version` no longer matches, 0 rows update, and we return 409 instead of overwriting.
r.put("/reviews/:id", auth, asyncH(async (req, res) => {
  const rating = int(req.body.rating, 1, 10, "Rating");
  const version = int(req.body.version, 1, 1e9, "Version");
  const body = typeof req.body.body === "string" ? req.body.body.trim().slice(0, 2000) : "";
  const [result] = await pool.execute(
    "UPDATE reviews SET rating=?, body=?, version=version+1 WHERE review_id=? AND user_id=? AND version=?",
    [rating, body, int(req.params.id, 1, 1e9, "Review id"), req.user.id, version]);
  if (result.affectedRows === 0) throw new HttpError(409, "This review was changed elsewhere. Refresh and try again.");
  res.json({ ok: true });
}));

r.delete("/reviews/:id", auth, asyncH(async (req, res) => {
  const id = int(req.params.id, 1, 1e9, "Review id");
  req.user.role === "admin"
    ? await q("DELETE FROM reviews WHERE review_id=?", [id])
    : await q("DELETE FROM reviews WHERE review_id=? AND user_id=?", [id, req.user.id]);
  res.json({ ok: true });
}));

export default r;

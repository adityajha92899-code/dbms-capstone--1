import { Router } from "express";
import { q, withTx } from "../db.js";
import { auth, asyncH, int, HttpError } from "../middleware.js";
import { upsertMovie } from "../movies.js";

const r = Router();
r.use(auth);

r.get("/", asyncH(async (req, res) => {
  const rows = await q(
    `SELECT m.movie_id AS id, m.title, m.poster_path, m.release_year, m.tmdb_rating AS vote_average,
            GROUP_CONCAT(mg.genre_id) AS gids
     FROM watchlist w JOIN movies m USING (movie_id) LEFT JOIN movie_genres mg USING (movie_id)
     WHERE w.user_id = ? GROUP BY m.movie_id, m.title, m.poster_path, m.release_year, m.tmdb_rating, w.added_at
     ORDER BY w.added_at DESC`, [req.user.id]);
  res.json(rows.map(({ gids, release_year, ...m }) => ({
    ...m, release_date: release_year ? `${release_year}-01-01` : "", genre_ids: gids ? gids.split(",").map(Number) : [],
  })));
}));

r.post("/", asyncH(async (req, res) => {
  await withTx(async (conn) => {
    if (!(await upsertMovie(conn, req.body.movie))) throw new HttpError(400, "Invalid movie.");
    await conn.execute("INSERT IGNORE INTO watchlist (user_id, movie_id) VALUES (?,?)", [req.user.id, req.body.movie.id]);
  });
  res.status(201).json({ ok: true });
}));

r.delete("/:movieId", asyncH(async (req, res) => {
  await q("DELETE FROM watchlist WHERE user_id=? AND movie_id=?", [req.user.id, int(req.params.movieId, 1, 1e9, "Movie id")]);
  res.json({ ok: true });
}));

export default r;

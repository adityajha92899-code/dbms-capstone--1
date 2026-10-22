import { q } from "./db.js";

// Cache a TMDB movie row (and genres) so foreign keys to it are valid.
// Accepts either list-shape (genre_ids) or detail-shape (genres:[{id}]).
export async function upsertMovie(conn, m) {
  const id = Number(m?.id);
  if (!Number.isInteger(id) || id <= 0 || typeof m.title !== "string") return false;
  const year = parseInt((m.release_date || "").slice(0, 4), 10) || null;
  await conn.execute(
    `INSERT INTO movies (movie_id,title,release_year,poster_path,tmdb_rating) VALUES (?,?,?,?,?)
     ON DUPLICATE KEY UPDATE title=VALUES(title), poster_path=VALUES(poster_path), tmdb_rating=VALUES(tmdb_rating)`,
    [id, m.title.slice(0, 255), year, (m.poster_path || null), Number.isFinite(+m.vote_average) ? +m.vote_average : null]
  );
  const gids = (m.genre_ids || (m.genres || []).map((g) => g.id)).map(Number).filter(Number.isInteger).slice(0, 10);
  if (gids.length) {
    const ph = gids.map(() => "?").join(",");
    await conn.execute(
      `INSERT IGNORE INTO movie_genres (movie_id, genre_id) SELECT ?, genre_id FROM genres WHERE genre_id IN (${ph})`,
      [id, ...gids]
    );
  }
  return true;
}
export const isPremium = async (uid) => (await q("SELECT fn_is_premium(?) AS p", [uid]))[0].p === 1;

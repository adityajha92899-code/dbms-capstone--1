import { Router } from "express";
import { pool, q } from "../db.js";
import { auth, requireRole, asyncH } from "../middleware.js";

const r = Router();
r.use(auth, requireRole("admin"));      // RBAC: admin only

r.get("/overview", asyncH(async (_req, res) => {
  const [row] = await q(`SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM reviews) AS reviews,
     (SELECT COUNT(*) FROM movies) AS movies, (SELECT COALESCE(SUM(amount),0) FROM transactions WHERE type='PURCHASE') AS revenue,
     (SELECT COUNT(*) FROM subscriptions WHERE status='ACTIVE' AND end_date >= CURDATE()) AS activeSubs`);
  res.json(row);
}));

// Window function: RANK() over average rating
r.get("/top-movies", asyncH(async (_req, res) => res.json(await q(
  `SELECT RANK() OVER (ORDER BY avg_rating DESC, review_count DESC) AS ranking, title, avg_rating AS avgRating, review_count AS reviews, watchlist_count AS watchlists
   FROM v_movie_stats WHERE review_count > 0 ORDER BY ranking LIMIT 10`))));

// Window functions: running total (SUM OVER) and month-over-month change (LAG)
r.get("/revenue", asyncH(async (_req, res) => res.json(await q(
  `SELECT month, revenue, SUM(revenue) OVER (ORDER BY month) AS runningTotal,
          ROUND(100*(revenue - LAG(revenue) OVER (ORDER BY month)) / NULLIF(LAG(revenue) OVER (ORDER BY month),0),1) AS momPct
   FROM (SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, SUM(amount) AS revenue
         FROM transactions WHERE type='PURCHASE' GROUP BY 1) m ORDER BY month`))));

// CTE + NTILE: customer segmentation by lifetime spend
r.get("/segments", asyncH(async (_req, res) => res.json(await q(
  `WITH spend AS (SELECT u.user_id, u.name, COALESCE(SUM(t.amount),0) AS spent
                  FROM users u LEFT JOIN transactions t ON t.user_id=u.user_id AND t.type='PURCHASE' WHERE u.role_id=1 GROUP BY u.user_id, u.name)
   SELECT name, spent, NTILE(4) OVER (ORDER BY spent DESC) AS quartile FROM spend ORDER BY spent DESC`))));

r.get("/audit", asyncH(async (_req, res) => res.json(await q(
  "SELECT log_id AS id, table_name AS tbl, action, user_id AS userId, details, created_at AS at FROM audit_log ORDER BY log_id DESC LIMIT 15"))));

// Star schema: ETL then query the warehouse
r.post("/etl", asyncH(async (_req, res) => { const [out] = await pool.query("CALL sp_run_etl()"); res.json(out[0][0]); }));
r.get("/warehouse/decades", asyncH(async (_req, res) => res.json(await q(
  `SELECT dd.decade_label AS decade, ROUND(AVG(f.rating),2) AS avgRating, COUNT(*) AS reviews
   FROM fact_review f JOIN dim_movie m USING (movie_key) JOIN dim_decade dd USING (decade_key)
   GROUP BY dd.decade_key, dd.decade_label ORDER BY dd.decade_key`))));

export default r;

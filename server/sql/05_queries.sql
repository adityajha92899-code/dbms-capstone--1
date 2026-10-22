-- =====================================================================
-- UNIT 2: SQL fundamentals & advanced queries (run in MySQL Workbench)
-- Each block is independent. Business theme: user-behaviour analytics.
-- =====================================================================
USE ajcinema;

-- ============ 1. DDL / DML / DCL / TCL tour ===========================
CREATE TABLE IF NOT EXISTS demo_tags (tag_id INT AUTO_INCREMENT PRIMARY KEY, tag VARCHAR(30) NOT NULL);  -- DDL
ALTER TABLE demo_tags ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;                          -- DDL
INSERT INTO demo_tags(tag) VALUES ('classic'),('mind-bender');                                            -- DML
UPDATE demo_tags SET tag = 'cult-classic' WHERE tag = 'classic';                                          -- DML
START TRANSACTION;                                                                                        -- TCL
  DELETE FROM demo_tags;
ROLLBACK;                                                                                                 -- undo!
SELECT * FROM demo_tags;                                                                                  -- still 2 rows
DROP TABLE demo_tags;                                                                                     -- DDL
-- DCL examples live in 04_security.sql (GRANT / REVOKE / CREATE ROLE)

-- ============ 2. JOINS ================================================
-- INNER: reviews with reviewer + movie
SELECT u.name, m.title, r.rating
FROM reviews r JOIN users u ON u.user_id = r.user_id JOIN movies m ON m.movie_id = r.movie_id
ORDER BY r.rating DESC, m.title;

-- LEFT OUTER: every movie, even unreviewed ones (find content gaps)
SELECT m.title, COUNT(r.review_id) AS reviews
FROM movies m LEFT JOIN reviews r ON r.movie_id = m.movie_id
GROUP BY m.movie_id, m.title HAVING reviews = 0;

-- RIGHT/ANTI-JOIN: users who never reviewed anything
SELECT u.name FROM users u LEFT JOIN reviews r ON r.user_id = u.user_id WHERE r.review_id IS NULL;

-- SELF JOIN: who referred whom
SELECT u.name AS member, ref.name AS referred_by
FROM users u LEFT JOIN users ref ON ref.user_id = u.referred_by;

-- ============ 3. SUBQUERIES ===========================================
-- scalar: movies rated above the platform average
SELECT title, avg_rating FROM v_movie_stats
WHERE avg_rating > (SELECT AVG(rating) FROM reviews);
-- correlated: each user's highest-rated movie
SELECT u.name, m.title, r.rating
FROM reviews r JOIN users u USING (user_id) JOIN movies m USING (movie_id)
WHERE r.rating = (SELECT MAX(r2.rating) FROM reviews r2 WHERE r2.user_id = r.user_id);
-- EXISTS: premium users who wrote at least one review
SELECT name FROM users u WHERE fn_is_premium(u.user_id)
  AND EXISTS (SELECT 1 FROM reviews r WHERE r.user_id = u.user_id);

-- ============ 4. SET OPERATIONS =======================================
-- UNION: everyone who is "active" in any way
SELECT user_id FROM reviews UNION SELECT user_id FROM watchlist;
-- INTERSECT: reviewers who ALSO have a watchlist   (MySQL 8.0.31+)
SELECT user_id FROM reviews INTERSECT SELECT user_id FROM watchlist;
-- EXCEPT: watchlist-only users (never reviewed)    (MySQL 8.0.31+)
SELECT user_id FROM watchlist EXCEPT SELECT user_id FROM reviews;

-- ============ 5. VIEWS ================================================
SELECT * FROM v_movie_stats ORDER BY avg_rating DESC, review_count DESC;
CREATE OR REPLACE VIEW v_user_spend AS
SELECT u.user_id, u.name, COALESCE(SUM(t.amount),0) AS total_spent
FROM users u LEFT JOIN transactions t ON t.user_id = u.user_id AND t.type = 'PURCHASE'
GROUP BY u.user_id, u.name;

-- ============ 6. WINDOW FUNCTIONS =====================================
-- RANK within a genre: best movie per genre
SELECT * FROM (
  SELECT g.name AS genre, s.title, s.avg_rating,
         RANK() OVER (PARTITION BY g.genre_id ORDER BY s.avg_rating DESC) AS rnk
  FROM v_movie_stats s JOIN movie_genres mg USING (movie_id) JOIN genres g USING (genre_id)
  WHERE s.avg_rating IS NOT NULL) ranked
WHERE rnk = 1 ORDER BY genre;

-- Monthly revenue, running total, month-over-month growth  (BI report)
SELECT month, revenue,
       SUM(revenue) OVER (ORDER BY month)                         AS running_total,
       revenue - LAG(revenue) OVER (ORDER BY month)               AS mom_change,
       ROUND(100*(revenue - LAG(revenue) OVER (ORDER BY month))
             / NULLIF(LAG(revenue) OVER (ORDER BY month),0), 1)   AS mom_pct
FROM (SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, SUM(amount) AS revenue
      FROM transactions WHERE type = 'PURCHASE' GROUP BY 1) m;

-- Customer segmentation by spend quartile
SELECT name, total_spent, NTILE(4) OVER (ORDER BY total_spent DESC) AS spend_quartile FROM v_user_spend;

-- Time between a user's consecutive reviews (engagement gaps)
SELECT user_id, created_at,
       DATEDIFF(created_at, LAG(created_at) OVER (PARTITION BY user_id ORDER BY created_at)) AS days_since_prev
FROM reviews ORDER BY user_id, created_at;

-- ============ 7. CTEs =================================================
-- Non-recursive: "super fans" = reviewers whose average beats the platform average
WITH user_avg AS (SELECT user_id, AVG(rating) a, COUNT(*) n FROM reviews GROUP BY user_id),
     platform AS (SELECT AVG(rating) p FROM reviews)
SELECT u.name, ROUND(ua.a,2) AS avg_given, ua.n FROM user_avg ua
JOIN platform ON ua.a > platform.p JOIN users u USING (user_id) ORDER BY ua.a DESC;

-- Recursive: full referral tree with depth
WITH RECURSIVE tree AS (
  SELECT user_id, name, 0 AS depth, CAST(name AS CHAR(300)) AS path FROM users WHERE referred_by IS NULL AND role_id = 1
  UNION ALL
  SELECT u.user_id, u.name, t.depth + 1, CONCAT(t.path,' > ',u.name)
  FROM users u JOIN tree t ON u.referred_by = t.user_id)
SELECT * FROM tree ORDER BY path;

-- ============ 8. E-commerce-style behaviour: cohort retention =========
-- How many users from each signup month came back to review in later months?
WITH cohort AS (SELECT user_id, DATE_FORMAT(created_at,'%Y-%m') AS signup_month FROM users),
     activity AS (SELECT user_id, DATE_FORMAT(created_at,'%Y-%m') AS active_month FROM reviews GROUP BY 1,2)
SELECT c.signup_month, a.active_month, COUNT(DISTINCT a.user_id) AS active_users
FROM cohort c JOIN activity a USING (user_id) GROUP BY 1,2 ORDER BY 1,2;

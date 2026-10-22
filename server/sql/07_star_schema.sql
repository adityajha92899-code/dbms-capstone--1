-- =====================================================================
-- UNIT 1 + 4: Data warehouse — STAR schema with one SNOWFLAKED dimension
-- OLTP tables (3NF) --ETL--> dim_* / fact_* tables optimised for analytics
-- =====================================================================
USE ajcinema;

CREATE TABLE dim_date (
  date_key INT PRIMARY KEY,               -- 20261022
  full_date DATE NOT NULL, year SMALLINT, quarter TINYINT, month TINYINT, month_name VARCHAR(10), day_of_week VARCHAR(10)
);
CREATE TABLE dim_user  (user_key INT AUTO_INCREMENT PRIMARY KEY, user_id INT, name VARCHAR(80), role_name VARCHAR(20), signup_month CHAR(7));
CREATE TABLE dim_plan  (plan_key TINYINT PRIMARY KEY, plan_name VARCHAR(40), price DECIMAL(8,2), duration_days INT);

-- SNOWFLAKE: dim_movie -> dim_decade is normalised into its own table
CREATE TABLE dim_decade (decade_key SMALLINT PRIMARY KEY, decade_label VARCHAR(10));
CREATE TABLE dim_movie  (movie_key INT AUTO_INCREMENT PRIMARY KEY, movie_id INT, title VARCHAR(255), decade_key SMALLINT,
                         FOREIGN KEY (decade_key) REFERENCES dim_decade(decade_key));

-- FACTS (grain = one row per review / one row per purchase)
CREATE TABLE fact_review (
  date_key INT, user_key INT, movie_key INT, rating TINYINT,
  INDEX (date_key), INDEX (user_key), INDEX (movie_key)
);
CREATE TABLE fact_revenue (
  date_key INT, user_key INT, plan_key TINYINT, amount DECIMAL(10,2),
  INDEX (date_key), INDEX (user_key), INDEX (plan_key)
);

DELIMITER $$
-- ETL: Extract from OLTP, Transform (derive keys/decades), Load into warehouse
CREATE PROCEDURE sp_run_etl()
BEGIN
  DELETE FROM fact_review;  DELETE FROM fact_revenue;
  DELETE FROM dim_movie;    DELETE FROM dim_decade;
  DELETE FROM dim_user;     DELETE FROM dim_plan;   DELETE FROM dim_date;

  -- dim_date: 2 years around today, generated (no source table needed)
  INSERT INTO dim_date
  SELECT DATE_FORMAT(d,'%Y%m%d')+0, d, YEAR(d), QUARTER(d), MONTH(d), MONTHNAME(d), DAYNAME(d)
  FROM (SELECT DATE_SUB(CURDATE(), INTERVAL 540 DAY) + INTERVAL (a.n + 10*b.n + 100*c.n) DAY AS d
        FROM (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a,
             (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b,
             (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) c) x
  WHERE d <= DATE_ADD(CURDATE(), INTERVAL 180 DAY);

  INSERT INTO dim_user(user_id,name,role_name,signup_month)
    SELECT u.user_id,u.name,r.role_name,DATE_FORMAT(u.created_at,'%Y-%m') FROM users u JOIN roles r USING(role_id);
  INSERT INTO dim_plan SELECT plan_id,name,price,duration_days FROM plans;
  INSERT INTO dim_decade SELECT DISTINCT FLOOR(release_year/10)*10, CONCAT(FLOOR(release_year/10)*10,'s')
    FROM movies WHERE release_year IS NOT NULL;
  INSERT INTO dim_movie(movie_id,title,decade_key) SELECT movie_id,title,FLOOR(release_year/10)*10 FROM movies;

  INSERT INTO fact_review
    SELECT DATE_FORMAT(r.created_at,'%Y%m%d')+0, du.user_key, dm.movie_key, r.rating
    FROM reviews r JOIN dim_user du ON du.user_id=r.user_id JOIN dim_movie dm ON dm.movie_id=r.movie_id;
  INSERT INTO fact_revenue
    SELECT DATE_FORMAT(t.created_at,'%Y%m%d')+0, du.user_key, s.plan_id, t.amount
    FROM transactions t JOIN dim_user du ON du.user_id=t.user_id JOIN subscriptions s ON s.subscription_id=t.subscription_id
    WHERE t.type='PURCHASE';

  SELECT (SELECT COUNT(*) FROM fact_review) AS review_facts, (SELECT COUNT(*) FROM fact_revenue) AS revenue_facts;
END$$
DELIMITER ;

-- Example star-schema queries (note how few joins & how readable they are):
--  SELECT dd.decade_label, ROUND(AVG(f.rating),2) avg_rating, COUNT(*) n
--  FROM fact_review f JOIN dim_movie m USING(movie_key) JOIN dim_decade dd USING(decade_key)
--  GROUP BY dd.decade_label ORDER BY dd.decade_label;
--
--  SELECT d.year, d.quarter, p.plan_name, SUM(f.amount) revenue
--  FROM fact_revenue f JOIN dim_date d USING(date_key) JOIN dim_plan p USING(plan_key)
--  GROUP BY d.year, d.quarter, p.plan_name WITH ROLLUP;

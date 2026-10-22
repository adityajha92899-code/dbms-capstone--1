-- =====================================================================
-- UNIT 2 + 4: Indexing & query optimisation (EXPLAIN before / after)
-- =====================================================================
USE ajcinema;

-- Build a 100,000-row table quickly with a digits cross-join (portable trick)
DROP TABLE IF EXISTS perf_events;
CREATE TABLE perf_events (
  event_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id  INT NOT NULL,
  movie_id INT NOT NULL,
  action   VARCHAR(10) NOT NULL,
  happened_at DATETIME NOT NULL
);
DROP TEMPORARY TABLE IF EXISTS digits;
CREATE TEMPORARY TABLE digits (d INT);
INSERT INTO digits VALUES (0),(1),(2),(3),(4),(5),(6),(7),(8),(9);
INSERT INTO perf_events(user_id, movie_id, action, happened_at)
SELECT 1 + (n % 9), 100 + (n % 5000), ELT(1 + (n % 3), 'view','like','share'),
       DATE_SUB(NOW(), INTERVAL (n % 365) DAY)
FROM (SELECT a.d + 10*b.d + 100*c.d + 1000*e.d + 10000*f.d AS n
      FROM digits a, digits b, digits c, digits e, digits f) nums;

-- ---- BEFORE: full table scan (type = ALL, rows ~100000) ---------------
EXPLAIN SELECT COUNT(*) FROM perf_events WHERE movie_id = 2500 AND action = 'like';

-- ---- Add a composite B-Tree index (leftmost-prefix rule: equality cols first)
CREATE INDEX idx_events_movie_action ON perf_events(movie_id, action);

-- ---- AFTER: type = ref, rows ~ 20  -----------------------------------
EXPLAIN SELECT COUNT(*) FROM perf_events WHERE movie_id = 2500 AND action = 'like';

-- Index NOT used: function on the indexed column (non-sargable) ...
CREATE INDEX idx_events_time ON perf_events(happened_at);
EXPLAIN SELECT COUNT(*) FROM perf_events WHERE DATE(happened_at) = CURDATE();
-- ... rewrite as a range so the index IS used (sargable)
EXPLAIN SELECT COUNT(*) FROM perf_events
WHERE happened_at >= CURDATE() AND happened_at < CURDATE() + INTERVAL 1 DAY;

-- Covering index: answered from the index alone ("Using index")
EXPLAIN SELECT movie_id, action FROM perf_events WHERE movie_id = 2500;

-- Hash vs B-Tree: B-Tree supports ranges & ORDER BY; HASH indexes (MEMORY engine,
-- or InnoDB's internal adaptive hash) only support equality lookups.
SHOW INDEX FROM perf_events;
DROP TABLE perf_events;

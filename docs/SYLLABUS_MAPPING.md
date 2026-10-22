# Syllabus ↔ Project Mapping

Every topic in the four units is implemented in a file you can open and demo.

## Unit 1 — Database Design & Relational Model
| Topic | Where |
|---|---|
| DBMS vs file system | *Before:* the original app kept data in browser `localStorage` (a file-like store: no constraints, no sharing, no concurrency). *After:* MySQL enforces integrity, supports many users and transactions. |
| ER model, generalization, specialization, aggregation | `docs/ER_DIAGRAM.md` |
| Schema, keys (PK / FK / candidate), integrity constraints | `server/sql/01_schema.sql` — PK, composite PK (`watchlist`), FK + `ON DELETE`, `UNIQUE(email)` (candidate key), `CHECK`, `NOT NULL`, `DEFAULT` |
| Normalization 1NF → BCNF | see below |
| Star & snowflake | `server/sql/07_star_schema.sql` |
| Tool demo | `docs/schema.dbml` → dbdiagram.io; MySQL Workbench for the SQL |

### Normalization walkthrough
* **Un-normalised:** TMDB returns `genre_ids: [28, 878, 12]` inside a movie → multi-valued attribute, violates **1NF**.
* **1NF:** split into `movie_genres(movie_id, genre_id)` — atomic values only.
* **2NF:** no partial dependencies. In `watchlist(user_id, movie_id, added_at)` the non-key `added_at` depends on the *whole* key. Genre names live in `genres`, not repeated per movie.
* **3NF:** `subscriptions` stores only `plan_id`; `price` / `duration_days` depend on `plan_id`, so they live in `plans` (otherwise `subscription_id → plan_id → price` is a transitive dependency).
* **BCNF:** every determinant is a candidate key. `users`: `user_id → *` and `email → *` (both candidate keys). `reviews`: `review_id → *` and `(user_id, movie_id) → *` (both candidate keys).
* **Deliberate denormalisation (be ready to defend it):** `transactions.balance_after` is derivable from history, but it is stored as an audit snapshot — recomputing a running balance for every statement would be slow and fragile.

## Unit 2 — SQL Queries & Advanced Operations
| Topic | Where (`server/sql/05_queries.sql`) |
|---|---|
| DDL / DML / DCL / TCL | section 1 (+ `04_security.sql` for DCL) |
| Inner / outer / self joins | section 2 (self-join = referrals) |
| Subqueries, set operations | sections 3–4 (`UNION`, `INTERSECT`, `EXCEPT`) |
| Views | `v_movie_stats`, `v_user_public` (01), `v_user_spend` (05) |
| Indexing & optimisation | `06_performance.sql` — `EXPLAIN` shows **100,000 rows scanned → 6** after a composite index; sargable vs non-sargable predicates; covering index |
| Window functions, CTEs | section 6–7: `RANK`, `LAG`, `NTILE`, running `SUM`, recursive CTE |
| **Practical:** customer behaviour trends | monthly revenue + MoM growth, spend quartiles, cohort retention (section 6 & 8) — also live in the Admin page |

## Unit 3 — Transactions, PL/SQL & Security
| Topic | Where |
|---|---|
| ACID, COMMIT / ROLLBACK / SAVEPOINT | `02_routines.sql` — `sp_topup_wallet`, `sp_purchase_subscription`, `sp_transfer_credits` (has a `SAVEPOINT`) |
| Pessimistic locking | `SELECT … FOR UPDATE` in `sp_purchase_subscription` |
| Optimistic locking | `reviews.version` + `UPDATE … WHERE version = ?` in `routes/reviews.js` → HTTP 409 on conflict |
| Deadlock avoidance | `sp_transfer_credits` always locks wallets in ascending `user_id` order |
| Isolation levels | InnoDB default is `REPEATABLE READ`; try `SET TRANSACTION ISOLATION LEVEL READ COMMITTED;` in two Workbench sessions while running a transfer |
| Stored procedures, functions, cursor, triggers | procedures above, `fn_is_premium`, cursor in `sp_expire_subscriptions`, 6 triggers (wallet creation, **non-negative balance**, audit trail) |
| **Practical:** banking-style transfers + balance triggers | wallet / transfer feature + `trg_wallets_bu` |
| Roles, privileges, RBAC | DB-level: `04_security.sql` (`CREATE ROLE`, `GRANT`; API runs as `aj_app` with **no DROP/ALTER**). App-level: JWT role claim + `requireRole("admin")` |
| SQL-injection prevention | 100% prepared statements (`pool.execute` + `?`), input validation, least-privilege DB user, no password hash in `v_user_public`, generic login error |

## Unit 4 — Performance, NoSQL & Real-world
| Topic | Where |
|---|---|
| Execution plans, B-Tree vs hash | `06_performance.sql` |
| Document store (MongoDB Atlas) | `server/src/routes/feed.js`, `server/scripts/seed-mongo.js` |
| **Practical:** social media DB (posts, comments, interactions) | Feed page. Design choice: comments **embedded** (always read with the post, bounded), likes = `$addToSet` array of user ids, users **referenced** by id with name denormalised |
| Aggregation pipeline | `GET /api/feed/trending` (`$group`, `$sort`, `$project`) — the idea behind real-time recommendation |
| ETL, warehouse vs lake | `sp_run_etl()` (Extract from OLTP → Transform → Load star schema). *Data lake* = raw, schema-on-read (e.g. TMDB JSON dumped to S3); *warehouse* = cleaned, schema-on-write (our `dim_/fact_`) |
| Cloud DBs | Deploy MySQL on **AWS RDS** (change `DB_HOST`), Mongo on **Atlas**; BigQuery / Azure SQL are the managed-warehouse equivalents of `07_star_schema.sql` |

## Real-world application notes (for your report)
* **Banking / healthcare:** the same pattern — strict relational schema, FK integrity, `CHECK` rules, audit triggers, ACID transfers, RBAC. Our `wallets / transactions / audit_log` is a miniature core-banking ledger; a hospital system replaces them with `patients / appointments / prescriptions` and adds row-level access by role.
* **Stock trading / payment gateways:** `sp_purchase_subscription` shows the essential pattern — lock the balance row, validate, debit, record, commit atomically.
* **Netflix / YouTube recommendations:** high-write, flexible-schema activity (likes, views, comments) fits a document store; our feed + `/trending` aggregation is the small-scale version.

## Suggested live-demo script
1. Show the ER diagram → open `01_schema.sql` → point at constraints.
2. Run `06_performance.sql`: `EXPLAIN` before/after index.
3. In the app: register → top up → subscribe → see ✨ Premium appear on your review.
4. Try to subscribe with no balance → rejected by the DB; show balance unchanged (atomicity).
5. Open two Workbench windows: transfer A→B and B→A simultaneously (no deadlock).
6. Edit a review in two browser tabs → second save gets the optimistic-lock conflict.
7. Type `' OR 1=1 --` in the login box → rejected (prepared statements).
8. Admin page → window-function reports → *Run ETL* → warehouse chart.
9. Feed page (Mongo) → post, like, comment, trending.

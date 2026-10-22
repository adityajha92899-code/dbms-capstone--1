# 🎬 AJ CINEMA — Full-Stack Database Capstone

A movie platform built to demonstrate the whole **Database Management** syllabus:
**MySQL** (relational design, SQL, transactions, security, warehouse) + **MongoDB** (social feed) + **Node/Express** API + **React** UI (TMDB for movie data).

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind, Redux Toolkit, React Router, Recharts |
| Backend | Node.js, Express, JWT auth, bcrypt, helmet, rate-limiting |
| Relational DB | MySQL 8 — users, reviews, watchlist, wallet, subscriptions, audit, star schema |
| NoSQL DB | MongoDB Atlas — posts, comments, likes, trending aggregation |
| External API | TMDB (movie catalogue) |

📖 **See `docs/SYLLABUS_MAPPING.md`** for a topic-by-topic map of the syllabus to files, plus a demo script and normalization walkthrough. ER diagram: `docs/ER_DIAGRAM.md`.

## Setup

**Prerequisites:** Node 18+, MySQL 8 running locally, a free [TMDB API key](https://www.themoviedb.org/settings/api), optionally a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

```bash
# 1. Frontend
cp .env.example .env            # add VITE_TMDB_API_KEY
npm install

# 2. Backend
cd server
cp .env.example .env            # set DB_ADMIN_PASSWORD (your MySQL root pw) and JWT_SECRET
npm install
npm run db:setup                # creates DB, tables, routines, triggers, roles, seed data, star schema
npm run dev                     # API on http://localhost:4000

# 3. (optional) social feed
#    put your Atlas connection string in server/.env as MONGO_URI, then:
npm run mongo:seed

# 4. Frontend (new terminal, project root)
npm run dev                     # http://localhost:5173
```

**Demo logins:** `admin@ajcinema.dev / Admin@123` (sees the Admin page) · `asha@demo.dev / Demo@1234`

> `.env` tip: values containing `#` must be quoted (`DB_PASSWORD="Aj_App#2026"`), otherwise dotenv cuts them at the `#`.

## Project layout
```
server/sql/        01_schema → 02_routines → 03_seed → 04_security  (run by db:setup)
                   05_queries.sql  (Unit 2 workbook – run manually in MySQL Workbench)
                   06_performance.sql  (EXPLAIN / indexing demo – run manually)
                   07_star_schema.sql  (warehouse + ETL procedure)
server/src/        Express API (routes: auth, watchlist, reviews, billing, feed, admin)
src/               React app (Home, Discover, Detail+Reviews, Favorites, Dashboard, Feed, Wallet, Admin)
docs/              ER diagram, DBML for dbdiagram.io, syllabus mapping
```

## Notes
* SQL was written for MySQL 8 and tested against a MySQL-compatible server (MariaDB 10.11). `INTERSECT` / `EXCEPT` in `05_queries.sql` need MySQL ≥ 8.0.31.
* The API runs as the least-privilege user `aj_app` (created by `04_security.sql`) — it cannot DROP or ALTER anything.
* If MongoDB isn't configured, everything else works and the Feed page explains how to enable it.

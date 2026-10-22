-- =====================================================================
-- AJ CINEMA  |  UNIT 1: Relational schema (3NF / BCNF)   |  MySQL 8
-- =====================================================================
DROP DATABASE IF EXISTS ajcinema;
CREATE DATABASE ajcinema CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ajcinema;

-- ---------- Generalization / Specialization --------------------------
-- USER (super-type) --> ADMIN (sub-type, table-per-subtype)
CREATE TABLE roles (
  role_id   TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE users (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(80)  NOT NULL,
  email         VARCHAR(120) NOT NULL,
  password_hash CHAR(60)     NOT NULL,             -- bcrypt, never plaintext
  role_id       TINYINT UNSIGNED NOT NULL DEFAULT 1,
  referred_by   INT NULL,                          -- unary (recursive) relationship
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_email UNIQUE (email),        -- candidate key
  CONSTRAINT fk_users_role  FOREIGN KEY (role_id)     REFERENCES roles(role_id),
  CONSTRAINT fk_users_ref   FOREIGN KEY (referred_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE admin_profiles (                      -- specialization of USER
  user_id    INT PRIMARY KEY,
  department VARCHAR(60) NOT NULL,
  CONSTRAINT fk_admin_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ---------- Catalogue (cache of TMDB data) ---------------------------
CREATE TABLE genres (
  genre_id INT PRIMARY KEY,                        -- TMDB genre id
  name     VARCHAR(40) NOT NULL UNIQUE
);

CREATE TABLE movies (
  movie_id     INT PRIMARY KEY,                    -- TMDB movie id
  title        VARCHAR(255) NOT NULL,
  release_year SMALLINT NULL,
  poster_path  VARCHAR(255) NULL,
  tmdb_rating  DECIMAL(3,1) NULL,
  cached_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- M:N movie <-> genre. Replaces the multi-valued `genre_ids` array => 1NF
CREATE TABLE movie_genres (
  movie_id INT NOT NULL,
  genre_id INT NOT NULL,
  PRIMARY KEY (movie_id, genre_id),
  CONSTRAINT fk_mg_movie FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE,
  CONSTRAINT fk_mg_genre FOREIGN KEY (genre_id) REFERENCES genres(genre_id)
);

-- ---------- User activity -------------------------------------------
CREATE TABLE watchlist (                           -- M:N user <-> movie
  user_id  INT NOT NULL,
  movie_id INT NOT NULL,
  added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, movie_id),                 -- composite PK
  CONSTRAINT fk_wl_user  FOREIGN KEY (user_id)  REFERENCES users(user_id)   ON DELETE CASCADE,
  CONSTRAINT fk_wl_movie FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE
);

CREATE TABLE reviews (
  review_id  INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  movie_id   INT NOT NULL,
  rating     TINYINT NOT NULL,
  body       VARCHAR(2000) NOT NULL DEFAULT '',
  version    INT NOT NULL DEFAULT 1,               -- optimistic-locking token
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT ck_review_rating CHECK (rating BETWEEN 1 AND 10),
  CONSTRAINT uq_review_once   UNIQUE (user_id, movie_id),   -- one review per user/movie
  CONSTRAINT fk_rv_user  FOREIGN KEY (user_id)  REFERENCES users(user_id)   ON DELETE CASCADE,
  CONSTRAINT fk_rv_movie FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE,
  INDEX idx_reviews_movie (movie_id, rating),
  INDEX idx_reviews_created (created_at)
);

-- ---------- Payments (banking-style) --------------------------------
CREATE TABLE plans (
  plan_id       TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(40) NOT NULL UNIQUE,
  price         DECIMAL(8,2) NOT NULL,
  duration_days INT NOT NULL,
  CONSTRAINT ck_plan_price CHECK (price > 0 AND duration_days > 0)
);

CREATE TABLE wallets (                             -- 1:1 with users
  user_id INT PRIMARY KEY,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  CONSTRAINT ck_wallet_nonneg CHECK (balance >= 0),
  CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- AGGREGATION: the relationship USER--buys-->PLAN is itself an entity
-- (SUBSCRIPTION) that other entities (TRANSACTION) relate to.
CREATE TABLE subscriptions (
  subscription_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  plan_id    TINYINT UNSIGNED NOT NULL,
  start_date DATE NOT NULL,
  end_date   DATE NOT NULL,
  status     ENUM('ACTIVE','EXPIRED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT fk_sub_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_sub_plan FOREIGN KEY (plan_id) REFERENCES plans(plan_id),
  INDEX idx_sub_user_status (user_id, status)
);

CREATE TABLE transactions (
  txn_id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  type            ENUM('TOPUP','PURCHASE','TRANSFER_OUT','TRANSFER_IN','REFUND') NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  balance_after   DECIMAL(10,2) NOT NULL,
  subscription_id INT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ck_txn_amount CHECK (amount > 0),
  CONSTRAINT fk_tx_user FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_tx_sub  FOREIGN KEY (subscription_id) REFERENCES subscriptions(subscription_id),
  INDEX idx_tx_user_created (user_id, created_at)
);

CREATE TABLE audit_log (                           -- filled by triggers (Unit 3)
  log_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
  table_name VARCHAR(40) NOT NULL,
  action     VARCHAR(10) NOT NULL,
  row_pk     VARCHAR(40) NOT NULL,
  user_id    INT NULL,
  details    VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Views (Unit 2) ------------------------------------------
CREATE VIEW v_movie_stats AS
SELECT m.movie_id, m.title, m.release_year, m.poster_path,
       COALESCE(r.review_count, 0) AS review_count,
       r.avg_rating,
       COALESCE(w.watchlist_count, 0) AS watchlist_count
FROM movies m
LEFT JOIN (SELECT movie_id, COUNT(*) AS review_count, ROUND(AVG(rating),1) AS avg_rating
           FROM reviews GROUP BY movie_id) r ON r.movie_id = m.movie_id
LEFT JOIN (SELECT movie_id, COUNT(*) AS watchlist_count
           FROM watchlist GROUP BY movie_id) w ON w.movie_id = m.movie_id;

-- Security view: exposes users WITHOUT password_hash / email
CREATE VIEW v_user_public AS
SELECT u.user_id, u.name, r.role_name, u.created_at
FROM users u JOIN roles r ON r.role_id = u.role_id;

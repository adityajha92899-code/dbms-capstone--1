# ER Diagram — AJ Cinema

Renders on GitHub / VS Code (Mermaid). For **dbdiagram.io**, paste `schema.dbml`. For **Lucidchart**, import the DBML/SQL (`server/sql/01_schema.sql`).

```mermaid
erDiagram
  ROLES ||--o{ USERS : "has"
  USERS ||--o| ADMIN_PROFILES : "specialization (is-a)"
  USERS |o--o{ USERS : "referred_by (unary)"
  USERS ||--|| WALLETS : "owns (1:1)"
  USERS ||--o{ WATCHLIST : "saves"
  MOVIES ||--o{ WATCHLIST : "saved in"
  USERS ||--o{ REVIEWS : "writes"
  MOVIES ||--o{ REVIEWS : "receives"
  MOVIES ||--o{ MOVIE_GENRES : ""
  GENRES ||--o{ MOVIE_GENRES : ""
  USERS ||--o{ SUBSCRIPTIONS : "buys"
  PLANS ||--o{ SUBSCRIPTIONS : "sold as"
  USERS ||--o{ TRANSACTIONS : "makes"
  SUBSCRIPTIONS |o--o{ TRANSACTIONS : "paid by (aggregation)"

  USERS { int user_id PK
          string email UK "candidate key"
          string password_hash
          int role_id FK
          int referred_by FK }
  WALLETS { int user_id PK,FK
            decimal balance "CHECK >= 0" }
  MOVIES { int movie_id PK "TMDB id"
           string title }
  REVIEWS { int review_id PK
            int user_id FK
            int movie_id FK
            tinyint rating "CHECK 1..10"
            int version "optimistic lock" }
  SUBSCRIPTIONS { int subscription_id PK
                  int user_id FK
                  tinyint plan_id FK
                  enum status }
  TRANSACTIONS { bigint txn_id PK
                 enum type
                 decimal amount
                 decimal balance_after }
```

## ER concepts used (Unit 1)

| Concept | Where |
|---|---|
| **Entity / weak-ish entity** | `users`, `movies`, `plans`; `wallets` depends on `users` |
| **Relationships** 1:1, 1:N, M:N | `users–wallets` (1:1), `users–reviews` (1:N), `movies–genres` via `movie_genres` and `users–movies` via `watchlist` (M:N) |
| **Unary (recursive)** | `users.referred_by → users.user_id` |
| **Generalization / Specialization** | `USER` is the super-type; `ADMIN_PROFILES` is the sub-type (table-per-subtype), plus role-based specialization via `roles` |
| **Aggregation** | The relationship *USER buys PLAN* is promoted to the entity `SUBSCRIPTION`, which then participates in its own relationship with `TRANSACTION` |

## Star & snowflake (analytics)

```mermaid
erDiagram
  FACT_REVIEW }o--|| DIM_DATE : ""
  FACT_REVIEW }o--|| DIM_USER : ""
  FACT_REVIEW }o--|| DIM_MOVIE : ""
  DIM_MOVIE }o--|| DIM_DECADE : "snowflaked"
  FACT_REVENUE }o--|| DIM_DATE : ""
  FACT_REVENUE }o--|| DIM_USER : ""
  FACT_REVENUE }o--|| DIM_PLAN : ""
```
*Star:* facts surrounded by denormalised dimensions → few joins, fast aggregation.
*Snowflake:* `dim_movie → dim_decade` is normalised into its own table (less redundancy, one extra join).

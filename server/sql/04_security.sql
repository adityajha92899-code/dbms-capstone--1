-- =====================================================================
-- UNIT 3: DCL  |  Roles, privileges, RBAC (database level)
-- =====================================================================
CREATE ROLE IF NOT EXISTS app_readonly, app_writer, app_admin;

-- read-only analyst: can read everything except password hashes (via view)
GRANT SELECT ON ajcinema.movies         TO app_readonly;
GRANT SELECT ON ajcinema.genres         TO app_readonly;
GRANT SELECT ON ajcinema.v_movie_stats  TO app_readonly;
GRANT SELECT ON ajcinema.v_user_public  TO app_readonly;

-- the API: least privilege — DML on the tables it needs + EXECUTE on routines.
-- NOTE: no DROP / ALTER / CREATE / GRANT => a SQL-injection bug can't destroy the schema.
GRANT SELECT, INSERT, UPDATE, DELETE ON ajcinema.* TO app_writer;
GRANT EXECUTE ON ajcinema.* TO app_writer;

GRANT ALL PRIVILEGES ON ajcinema.* TO app_admin;

CREATE USER IF NOT EXISTS 'aj_app'@'localhost' IDENTIFIED BY 'Aj_App#2026';
CREATE USER IF NOT EXISTS 'aj_analyst'@'localhost' IDENTIFIED BY 'Aj_Analyst#2026';
GRANT app_writer   TO 'aj_app'@'localhost';
GRANT app_readonly TO 'aj_analyst'@'localhost';
-- MySQL 8:  SET DEFAULT ROLE app_writer TO 'aj_app'@'localhost';
-- MariaDB:  SET DEFAULT ROLE app_writer FOR 'aj_app'@'localhost';

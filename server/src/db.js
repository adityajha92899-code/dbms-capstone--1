import mysql from "mysql2/promise";
import "dotenv/config";

// Connection pool. Every query below uses placeholders (?) => prepared statements,
// so user input is NEVER concatenated into SQL (SQL-injection prevention).
export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: +(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "aj_app",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ajcinema",
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
});

export const q = (sql, params = []) => pool.execute(sql, params).then(([rows]) => rows);

// Run several statements as ONE ACID transaction
export async function withTx(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const out = await fn(conn);
    await conn.commit();
    return out;
  } catch (e) { await conn.rollback(); throw e; }
  finally { conn.release(); }
}

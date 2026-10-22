// Runs the SQL files against MySQL.  Usage:  npm run db:setup
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import "dotenv/config";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../sql");
const FILES = ["01_schema.sql", "02_routines.sql", "03_seed.sql", "04_security.sql", "07_star_schema.sql"];

// The mysql client understands DELIMITER; the driver doesn't. Parse it ourselves.
function split(sql) {
  const out = []; let delim = ";"; let buf = "";
  for (const line of sql.split(/\r?\n/)) {
    const m = line.match(/^DELIMITER\s+(\S+)/i);
    if (m) { delim = m[1]; continue; }
    if (/^\s*--/.test(line) && !buf.trim()) continue;       // skip leading comments
    buf += line + "\n";
    if (line.trimEnd().endsWith(delim)) {
      const stmt = buf.trimEnd().slice(0, -delim.length).trim();
      if (stmt) out.push(stmt);
      buf = "";
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost", port: +(process.env.DB_PORT || 3306),
  user: process.env.DB_ADMIN_USER || "root", password: process.env.DB_ADMIN_PASSWORD || "",
  multipleStatements: false,
});

const adminHash = await bcrypt.hash("Admin@123", 10);
const demoHash  = await bcrypt.hash("Demo@1234", 10);

for (const f of FILES) {
  const sql = fs.readFileSync(path.join(dir, f), "utf8")
    .replaceAll("{{ADMIN_HASH}}", adminHash).replaceAll("{{DEMO_HASH}}", demoHash);
  const stmts = split(sql);
  let n = 0;
  for (const s of stmts) {
    try { await conn.query(s); n++; }
    catch (e) {
      if (f === "04_security.sql") { console.warn(`  ! ${f}: ${e.message} (skipped — needs CREATE USER privilege)`); continue; }
      console.error(`\n✗ ${f} failed on:\n${s.slice(0, 200)}\n→ ${e.message}`); process.exit(1);
    }
  }
  console.log(`✓ ${f} (${n} statements)`);
}

// default-role syntax differs between MySQL 8 and MariaDB
for (const q of ["SET DEFAULT ROLE app_writer TO 'aj_app'@'localhost'", "SET DEFAULT ROLE app_writer FOR 'aj_app'@'localhost'"]) {
  try { await conn.query(q); break; } catch { /* try next dialect */ }
}
await conn.end();
console.log("\nDatabase ready. Demo logins:  admin@ajcinema.dev / Admin@123   asha@demo.dev / Demo@1234");

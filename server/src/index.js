import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import "dotenv/config";
import { pool } from "./db.js";
import { connectMongo, posts } from "./mongo.js";
import { errorHandler } from "./middleware.js";
import auth from "./routes/auth.js";
import watchlist from "./routes/watchlist.js";
import reviews from "./routes/reviews.js";
import billing from "./routes/billing.js";
import feed from "./routes/feed.js";
import admin from "./routes/admin.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "20kb" }));
app.use("/api", rateLimit({ windowMs: 60_000, limit: 200 }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60_000, limit: 30, message: { error: "Too many attempts, try later." } }));

app.get("/api/health", async (_req, res) => {
  let mysql = false; try { await pool.query("SELECT 1"); mysql = true; } catch { /* down */ }
  res.json({ ok: mysql, mysql, mongo: !!posts() });
});
app.use("/api/auth", auth);
app.use("/api/watchlist", watchlist);
app.use("/api", reviews);
app.use("/api/billing", billing);
app.use("/api/feed", feed);
app.use("/api/admin", admin);
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found." }));
app.use(errorHandler);

await connectMongo();
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`✓ API on http://localhost:${port}`));

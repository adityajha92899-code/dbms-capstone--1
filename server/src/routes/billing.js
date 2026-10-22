import { Router } from "express";
import { pool, q } from "../db.js";
import { auth, asyncH, int, str, HttpError } from "../middleware.js";
import { isPremium } from "../movies.js";

const r = Router();
const call = async (sql, params) => { const [res] = await pool.query(sql, params); return res[0][0]; }; // first row of CALL's result set

r.get("/plans", asyncH(async (_req, res) => res.json(await q("SELECT plan_id AS id, name, price, duration_days AS days FROM plans ORDER BY price"))));

r.use(auth);

r.get("/wallet", asyncH(async (req, res) => {
  const [w]  = await q("SELECT balance FROM wallets WHERE user_id=?", [req.user.id]);
  const [sub] = await q(
    `SELECT p.name AS plan, s.end_date AS endsOn FROM subscriptions s JOIN plans p USING (plan_id)
     WHERE s.user_id=? AND s.status='ACTIVE' AND s.end_date >= CURDATE() ORDER BY s.end_date DESC LIMIT 1`, [req.user.id]);
  const txns = await q(
    "SELECT txn_id AS id, type, amount, balance_after AS balanceAfter, created_at AS createdAt FROM transactions WHERE user_id=? ORDER BY txn_id DESC LIMIT 15", [req.user.id]);
  res.json({ balance: w?.balance ?? 0, isPremium: await isPremium(req.user.id), subscription: sub || null, transactions: txns });
}));

// All money movement goes through stored procedures => ACID + business rules live in the DB
r.post("/topup", asyncH(async (req, res) => {
  res.json(await call("CALL sp_topup_wallet(?, ?)", [req.user.id, Number(req.body.amount)]));
}));
r.post("/subscribe", asyncH(async (req, res) => {
  res.json(await call("CALL sp_purchase_subscription(?, ?)", [req.user.id, int(req.body.planId, 1, 255, "Plan")]));
}));
r.post("/transfer", asyncH(async (req, res) => {
  const email = str(req.body.toEmail, 5, 120, "Recipient email").toLowerCase();
  const [to] = await q("SELECT user_id FROM users WHERE email=?", [email]);
  if (!to) throw new HttpError(404, "No user with that email.");
  res.json(await call("CALL sp_transfer_credits(?, ?, ?)", [req.user.id, to.user_id, Number(req.body.amount)]));
}));

export default r;

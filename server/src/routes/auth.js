import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { q } from "../db.js";
import { SECRET, asyncH, auth, str, HttpError } from "../middleware.js";
import { isPremium } from "../movies.js";

const r = Router();
const avatar = (name) => `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;

async function publicUser(row) {
  return { id: row.user_id, name: row.name, email: row.email, role: row.role_name,
           avatar: avatar(row.name), isPremium: await isPremium(row.user_id) };
}
const sign = (row) => jwt.sign({ id: row.user_id, role: row.role_name, name: row.name }, SECRET, { expiresIn: "7d" });

r.post("/register", asyncH(async (req, res) => {
  const name  = str(req.body.name, 2, 80, "Name");
  const email = str(req.body.email, 5, 120, "Email").toLowerCase();
  const pw    = str(req.body.password, 8, 72, "Password");
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, "Enter a valid email.");
  const hash = await bcrypt.hash(pw, 10);
  try { await q("INSERT INTO users (name,email,password_hash) VALUES (?,?,?)", [name, email, hash]); }
  catch (e) { if (e.code === "ER_DUP_ENTRY") throw new HttpError(409, "That email is already registered."); throw e; }
  const [row] = await q("SELECT u.*, r.role_name FROM users u JOIN roles r USING(role_id) WHERE email=?", [email]);
  res.status(201).json({ token: sign(row), user: await publicUser(row) });
}));

r.post("/login", asyncH(async (req, res) => {
  const email = str(req.body.email, 3, 120, "Email").toLowerCase();
  const [row] = await q("SELECT u.*, r.role_name FROM users u JOIN roles r USING(role_id) WHERE email=?", [email]);
  // same message for unknown email & wrong password => no account enumeration
  if (!row || !(await bcrypt.compare(String(req.body.password || ""), row.password_hash)))
    throw new HttpError(401, "Invalid email or password.");
  res.json({ token: sign(row), user: await publicUser(row) });
}));

r.get("/me", auth, asyncH(async (req, res) => {
  const [row] = await q("SELECT u.*, r.role_name FROM users u JOIN roles r USING(role_id) WHERE user_id=?", [req.user.id]);
  if (!row) throw new HttpError(401, "Account no longer exists.");
  res.json({ user: await publicUser(row) });
}));

export default r;

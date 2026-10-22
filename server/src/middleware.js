import jwt from "jsonwebtoken";
import "dotenv/config";

export const SECRET = process.env.JWT_SECRET || "dev-only-secret";
if (!process.env.JWT_SECRET) console.warn("! JWT_SECRET not set — using an insecure dev secret");

export const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer /, "");
  try { req.user = jwt.verify(token, SECRET); next(); }
  catch { res.status(401).json({ error: "Please sign in." }); }
}
export function optionalAuth(req, _res, next) {
  try { req.user = jwt.verify((req.headers.authorization || "").replace(/^Bearer /, ""), SECRET); } catch { /* anonymous */ }
  next();
}

// Application-level RBAC
export const requireRole = (role) => (req, res, next) =>
  req.user?.role === role ? next() : res.status(403).json({ error: "Forbidden." });

export class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }

export function errorHandler(err, _req, res, _next) {
  if (err.status) return res.status(err.status).json({ error: err.message });
  if (err.sqlState === "45000") return res.status(400).json({ error: err.sqlMessage }); // our SIGNALed business rules
  if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Already exists." });
  if (err.code === "ER_CHECK_CONSTRAINT_VIOLATED" || err.errno === 4025) return res.status(400).json({ error: "Value out of range." });
  console.error(err);
  res.status(500).json({ error: "Server error." });
}

// tiny validators
export const str = (v, min, max, label) => {
  if (typeof v !== "string" || v.trim().length < min || v.trim().length > max)
    throw new HttpError(400, `${label} must be ${min}-${max} characters.`);
  return v.trim();
};
export const int = (v, min, max, label) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw new HttpError(400, `${label} must be an integer ${min}-${max}.`);
  return n;
};

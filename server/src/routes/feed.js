import { Router } from "express";
import { ObjectId } from "mongodb";
import { posts } from "../mongo.js";
import { auth, optionalAuth, asyncH, int, str, HttpError } from "../middleware.js";

const r = Router();

// Document model (Unit 4): comments are EMBEDDED in the post (read together, bounded size);
// likes are an array of user ids ($addToSet => idempotent). Users are referenced by id, with
// the display name denormalised for fast reads (no joins in NoSQL).
r.use((_req, _res, next) => (posts() ? next() : _res.status(503).json({ error: "Social feed is offline (MongoDB not configured)." })));

const oid = (v) => { if (typeof v !== "string" || !ObjectId.isValid(v)) throw new HttpError(400, "Bad id."); return new ObjectId(v); };
const shape = (p, uid) => ({
  id: p._id.toString(), userId: p.userId, userName: p.userName, movieId: p.movieId, movieTitle: p.movieTitle,
  text: p.text, createdAt: p.createdAt, likeCount: p.likes.length, liked: uid ? p.likes.includes(uid) : false,
  comments: p.comments.map((c) => ({ id: c._id.toString(), userName: c.userName, text: c.text, createdAt: c.createdAt })),
});

r.get("/", optionalAuth, asyncH(async (req, res) => {
  const limit = int(req.query.limit ?? 20, 1, 50, "Limit");
  const filter = {};
  if (req.query.movieId) filter.movieId = int(req.query.movieId, 1, 1e9, "Movie id");
  if (typeof req.query.before === "string" && !isNaN(Date.parse(req.query.before))) filter.createdAt = { $lt: new Date(req.query.before) };
  const list = await posts().find(filter).sort({ createdAt: -1 }).limit(limit).toArray();
  res.json(list.map((p) => shape(p, req.user?.id)));
}));

// Aggregation pipeline: which movies is the community talking about?
r.get("/trending", asyncH(async (_req, res) => {
  res.json(await posts().aggregate([
    { $match: { movieId: { $ne: null } } },
    { $group: { _id: { id: "$movieId", title: "$movieTitle" }, posts: { $sum: 1 },
                likes: { $sum: { $size: "$likes" } }, comments: { $sum: { $size: "$comments" } } } },
    { $addFields: { score: { $add: ["$posts", "$likes", { $multiply: ["$comments", 2] }] } } },
    { $sort: { score: -1 } }, { $limit: 5 },
    { $project: { _id: 0, movieId: "$_id.id", title: "$_id.title", posts: 1, likes: 1, comments: 1, score: 1 } },
  ]).toArray());
}));

r.post("/", auth, asyncH(async (req, res) => {
  const text = str(req.body.text, 1, 500, "Post");
  const doc = { userId: req.user.id, userName: req.user.name, text, likes: [], comments: [], createdAt: new Date(),
                movieId: null, movieTitle: null };
  if (req.body.movieId) { doc.movieId = int(req.body.movieId, 1, 1e9, "Movie id"); doc.movieTitle = str(req.body.movieTitle, 1, 255, "Movie title"); }
  const { insertedId } = await posts().insertOne(doc);
  res.status(201).json(shape({ ...doc, _id: insertedId }, req.user.id));
}));

r.post("/:id/like", auth, asyncH(async (req, res) => {
  const _id = oid(req.params.id);
  // NoSQL-injection safe: ids are validated strings, never raw request objects inside a query
  const added = await posts().updateOne({ _id, likes: { $ne: req.user.id } }, { $addToSet: { likes: req.user.id } });
  if (!added.modifiedCount) await posts().updateOne({ _id }, { $pull: { likes: req.user.id } });
  const p = await posts().findOne({ _id });
  if (!p) throw new HttpError(404, "Post not found.");
  res.json(shape(p, req.user.id));
}));

r.post("/:id/comments", auth, asyncH(async (req, res) => {
  const _id = oid(req.params.id);
  const c = { _id: new ObjectId(), userId: req.user.id, userName: req.user.name, text: str(req.body.text, 1, 300, "Comment"), createdAt: new Date() };
  const out = await posts().findOneAndUpdate({ _id }, { $push: { comments: { $each: [c], $slice: -200 } } }, { returnDocument: "after" });
  if (!out) throw new HttpError(404, "Post not found.");
  res.status(201).json(shape(out, req.user.id));
}));

r.delete("/:id", auth, asyncH(async (req, res) => {
  const filter = { _id: oid(req.params.id) };
  if (req.user.role !== "admin") filter.userId = req.user.id;
  const out = await posts().deleteOne(filter);
  if (!out.deletedCount) throw new HttpError(404, "Post not found or not yours.");
  res.json({ ok: true });
}));

export default r;

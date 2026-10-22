import { MongoClient } from "mongodb";
import "dotenv/config";

let db = null;
export async function connectMongo() {
  if (!process.env.MONGO_URI) { console.log("• MongoDB: MONGO_URI not set — social feed disabled"); return null; }
  try {
    const client = new MongoClient(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    db = client.db(process.env.MONGO_DB || "ajcinema");
    await db.collection("posts").createIndex({ createdAt: -1 });
    await db.collection("posts").createIndex({ movieId: 1, createdAt: -1 });
    await db.collection("posts").createIndex({ userId: 1 });
    console.log("✓ MongoDB connected");
  } catch (e) { console.warn("! MongoDB unavailable:", e.message); db = null; }
  return db;
}
export const posts = () => db?.collection("posts") ?? null;

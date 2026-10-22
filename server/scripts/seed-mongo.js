// Seeds a few demo posts into MongoDB Atlas.  Usage:  npm run mongo:seed
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";

if (!process.env.MONGO_URI) { console.error("Set MONGO_URI in server/.env first (MongoDB Atlas connection string)."); process.exit(1); }
const client = new MongoClient(process.env.MONGO_URI);
await client.connect();
const posts = client.db(process.env.MONGO_DB || "ajcinema").collection("posts");

await posts.deleteMany({});
const ago = (h) => new Date(Date.now() - h * 3600_000);
const c = (userName, text, h) => ({ _id: new ObjectId(), userName, text, createdAt: ago(h) });
await posts.insertMany([
  { userId: 2, userName: "Asha Verma",  movieId: 27205,  movieTitle: "Inception",     text: "Watched it again — the spinning top ending still gets me.", likes: [3, 4, 5], comments: [c("Rohan Mehta", "Team 'it fell' 😄", 20)], createdAt: ago(30) },
  { userId: 3, userName: "Rohan Mehta", movieId: 157336, movieTitle: "Interstellar",  text: "That docking scene deserves every award.",                  likes: [2, 6],    comments: [],                                   createdAt: ago(22) },
  { userId: 4, userName: "Priya Nair",  movieId: 496243, movieTitle: "Parasite",      text: "Rewatching Parasite — the staircase shots are genius.",     likes: [2, 3, 7, 8], comments: [c("Dev Patel", "Best film of the 2010s.", 9)], createdAt: ago(14) },
  { userId: 5, userName: "Kabir Singh", movieId: 155,    movieTitle: "The Dark Knight", text: "Heath Ledger's Joker is untouchable.",                    likes: [2],       comments: [],                                   createdAt: ago(6) },
  { userId: 6, userName: "Meera Iyer",  movieId: null,   movieTitle: null,            text: "Weekend plan: Ghibli marathon. Suggestions?",               likes: [],        comments: [c("Sara Khan", "Start with Spirited Away!", 2)], createdAt: ago(3) },
]);
await posts.createIndex({ createdAt: -1 });
await posts.createIndex({ movieId: 1, createdAt: -1 });
console.log("✓ Seeded", await posts.countDocuments(), "posts");
await client.close();

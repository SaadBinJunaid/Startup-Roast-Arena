// backend/scripts/setupDatabase.js
// ------------------------------------------------------------
// One-off, NON-destructive setup for the Smit-Project database:
//   1. Reads MONGO_URI from backend/.env (never prints it).
//   2. Refuses to run unless the database name is Smit-Project.
//   3. Creates the four collections explicitly (models alone only
//      create them on the first write).
//   4. Ensures the unique indexes (email, one-vote-per-idea).
//   5. Prints the final collection list.
// It NEVER inserts, updates, drops or deletes any documents.
//
// Run with:  node scripts/setupDatabase.js   (from backend/)
// ------------------------------------------------------------

import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";
import Idea from "../models/Idea.js";
import Review from "../models/Review.js";
import Vote from "../models/Vote.js";

dotenv.config();

const EXPECTED_DB = "Smit-Project";

// Safely pull the database name out of a MongoDB URI without ever
// printing the URI itself (it contains credentials).
function extractDbName(uri) {
  const match = uri.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^?#]+)/);
  return match ? match[1] : null;
}

async function main() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("ERROR: MONGO_URI is not set in backend/.env");
    process.exit(1);
  }

  // Safety rule: only ever touch OUR database.
  const dbName = extractDbName(uri);

  if (dbName !== EXPECTED_DB) {
    console.error(
      `REFUSED to connect: database in .env is "${dbName}", expected "${EXPECTED_DB}".`
    );
    console.error("Fix backend/.env before running this script.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`Connected to database: ${dbName}`);

  // What already exists? (listCollections returns a cursor -> toArray())
  const before = await mongoose.connection.db.listCollections().toArray();
  const beforeNames = before.map((collection) => collection.name);
  console.log(
    "Collections before: " + (beforeNames.length ? beforeNames.join(", ") : "(none)")
  );

  // The four models -> their actual MongoDB collection names.
  const models = [User, Idea, Review, Vote];

  for (const model of models) {
    const name = model.collection.name; // e.g. "users", "ideas"...

    if (beforeNames.includes(name)) {
      console.log(`Already exists : ${name}`);
    } else {
      await mongoose.connection.createCollection(name);
      console.log(`Created        : ${name}`);
    }
  }

  // Unique indexes work without any documents. These enforce:
  //   - one account per email
  //   - one vote per user per idea (409 on duplicate)
  await User.createIndexes();
  await Vote.createIndexes();
  console.log("Indexes ensured : users.email unique, votes.idea+votes.user unique");

  // Verify the end state.
  const after = await mongoose.connection.db.listCollections().toArray();
  const afterNames = after.map((collection) => collection.name);
  console.log("Collections after: " + afterNames.join(", "));

  const voteIndexes = await Vote.collection.getIndexes();
  console.log("Votes indexes   : " + Object.keys(voteIndexes).join(", "));

  await mongoose.disconnect();
  console.log("Done. No documents were inserted.");
}

main().catch((error) => {
  console.error("Setup failed:", error.message);
  process.exit(1);
});

// config/database.js (formerly db.js)
// Responsibility: connect our Express app to MongoDB Atlas using Mongoose.
// We keep this in its own file so the connection logic is in ONE place.
//
// Deployment notes (Vercel serverless):
//   - The connection is CACHED on globalThis, so a warm function instance
//     reuses ONE connection across requests instead of opening a new one
//     for every request (which would quickly exhaust Atlas connections).
//   - On Vercel we never call process.exit(): killing the process there
//     would crash the whole serverless function. Instead the error is
//     rethrown and the request middleware answers with a clean 503.

import mongoose from "mongoose";

// globalThis survives between requests in the same serverless instance,
// so it is the standard place to cache the connection. In plain Node
// (local development) it simply behaves like a normal module-level variable.
const globalWithCache = globalThis;

if (!globalWithCache._mongooseCache) {
  globalWithCache._mongooseCache = { conn: null, promise: null };
}

const cache = globalWithCache._mongooseCache;

async function connectDB() {
  // 1) Already connected -> reuse the existing connection instantly.
  if (cache.conn) {
    return cache.conn;
  }

  // 2) First caller starts the connection. Parallel callers await the SAME
  //    promise, so only one connection is ever created per instance.
  if (!cache.promise) {
    cache.promise = mongoose.connect(process.env.MONGO_URI).then((connection) => {
      // Log once per connection (same message as before the refactor).
      console.log(`MongoDB connected: ${connection.connection.host}`);
      return connection;
    });
  }

  try {
    cache.conn = await cache.promise;
    return cache.conn;
  } catch (error) {
    // Clear the failed promise so the NEXT request can retry cleanly.
    cache.promise = null;

    console.error(`MongoDB connection error: ${error.message}`);

    // Locally the app is useless without a database, so stop it
    // (original behaviour, unchanged for npm start / npm run dev).
    // On Vercel (process.env.VERCEL is set) we must NEVER exit the
    // process: rethrow instead so the caller can return a 503 response.
    if (!process.env.VERCEL) {
      process.exit(1);
    }

    throw error;
  }
}

export default connectDB;

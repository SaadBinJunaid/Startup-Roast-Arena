// index.js
// Responsibility: the entry point of the backend.
// It loads environment variables, sets up Express, connects to MongoDB,
// mounts the routes, and starts the server.
//
// DEPLOYMENT (Vercel): the Express app is exported as the default export.
// Vercel detects index.js at the project root, uses that export as a
// single serverless function, and routes every request through it.
// Without this export Vercel fails with:
//   "No exports found in module .../index.js"
// The local app.listen() below only runs when NOT on Vercel.

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import ideaRoutes from "./routes/ideaRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

// 1) Load variables from .env into process.env. Must run before we use them.
// On Vercel there is no .env file (variables come from project settings),
// and dotenv simply does nothing when the file is missing.
dotenv.config();

// 2) Create the Express application.
const app = express();

// 3) Global middleware.

// CORS: when CORS_ORIGIN is set (production) ONLY those origins may call
// the API. It accepts a comma-separated list, e.g.
//   CORS_ORIGIN=https://your-frontend.vercel.app
// When it is NOT set, all origins are allowed — the original behaviour,
// so local development keeps working with zero configuration.
const corsOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = corsOrigins.length > 0 ? { origin: corsOrigins } : {};

app.use(cors(corsOptions)); // allow requests from the frontend
app.use(express.json()); // parse incoming JSON request bodies

// 4) Simple checks.
app.get("/", (req, res) => {
  res.json({ message: "Startup Roast Arena API is running" });
});

app.get("/api/health", (req, res) => {
  // mongoose.connection.readyState: 0 disconnected, 1 connected,
  // 2 connecting, 3 disconnecting.
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  const databaseState = states[mongoose.connection.readyState] || "unknown";

  res.status(200).json({ status: "ok", database: databaseState });
});

// Serverless-safe database connection.
// Locally startServer() connects before listening, so this returns the
// cached connection instantly. On Vercel there is no startServer(), so
// every /api request awaits the (cached) connection here first.
// If the database is unreachable it answers 503 instead of crashing.
async function ensureDatabase(req, res, next) {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(503).json({
      message: "Database unavailable. Please try again later.",
    });
  }
}

// 5) Mount feature routes.
// /api and /api/health above do NOT require the database middleware;
// every feature route does. Order matters: the middleware must be
// registered BEFORE the routers it protects.
app.use("/api", ensureDatabase);
app.use("/api/auth", authRoutes);
app.use("/api/ideas", ideaRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

// 6) 404 handler + central error handler. These MUST come after the routes.
// The error handler always sends a JSON response, which Vercel requires so
// the function never ends up in an undefined state.
app.use(notFound);
app.use(errorHandler);

// 7) Start the server only after the database connects — but ONLY when
// running locally (npm start / npm run dev). On Vercel process.env.VERCEL
// is set, and calling listen() there would conflict with the platform's
// serverless execution (the exported app below is used instead).
const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

// Vercel entry point: the platform looks for a default export of an
// Express app in index.js at the project root.
// Docs: https://vercel.com/docs/frameworks/backend/express
export default app;

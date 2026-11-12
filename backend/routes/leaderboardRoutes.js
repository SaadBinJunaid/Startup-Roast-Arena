// routes/leaderboardRoutes.js
// Responsibility: the public leaderboard URL.
//   GET /api/leaderboard

import express from "express";
import { getLeaderboard } from "../controllers/leaderboardController.js";

const router = express.Router();

router.get("/", getLeaderboard);

export default router;

// routes/voteRoutes.js
// Responsibility: voting URLs, nested under an idea, e.g.
//   POST /api/ideas/:id/vote
//   GET  /api/ideas/:id/votes

import express from "express";
import { voteIdea, getVotes } from "../controllers/voteController.js";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router({ mergeParams: true });

router.post("/vote", protect, voteIdea);
// optionalAuth: works for guests, but adds req.user when a token is present.
router.get("/votes", optionalAuth, getVotes);

export default router;

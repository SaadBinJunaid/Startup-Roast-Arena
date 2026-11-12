// routes/reviewRoutes.js
// Responsibility: AI review URLs. These are NESTED under an idea, e.g.
//   POST /api/ideas/:id/evaluate
//   GET  /api/ideas/:id/reviews
// mergeParams lets this router read :id from the parent route.

import express from "express";
import { evaluateIdea, getReviews } from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router({ mergeParams: true });

router.post("/evaluate", protect, evaluateIdea);
router.get("/reviews", getReviews);

export default router;

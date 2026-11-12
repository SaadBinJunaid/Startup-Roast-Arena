// routes/ideaRoutes.js
// Responsibility: idea URLs plus the nested review/vote routes.

import express from "express";
import {
  createIdea,
  getIdeas,
  getIdea,
  repitchIdea,
} from "../controllers/ideaController.js";
import { protect } from "../middleware/authMiddleware.js";
import reviewRoutes from "./reviewRoutes.js";
import voteRoutes from "./voteRoutes.js";

const router = express.Router();

// Nested routers (they handle paths like /:id/evaluate, /:id/reviews,
// /:id/vote, /:id/votes). They are registered BEFORE the generic "/:id".
router.use("/:id", reviewRoutes);
router.use("/:id", voteRoutes);

// Main idea routes.
router.post("/", protect, createIdea);
router.get("/", getIdeas);
router.get("/:id", getIdea);
router.put("/:id/repitch", protect, repitchIdea);

export default router;

// routes/authRoutes.js
// Responsibility: connect authentication URLs to their controller functions.
// This file only decides "which URL goes to which function" - no logic here.

import express from "express";
import { registerUser, loginUser, getMe } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Private route: "protect" runs first, then getMe.
router.get("/me", protect, getMe);

export default router;

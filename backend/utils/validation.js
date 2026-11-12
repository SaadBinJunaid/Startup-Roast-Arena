// utils/validation.js
// Responsibility: hold all Zod schemas used to validate incoming request data
// AND the AI responses before we trust or save them.

import { z } from "zod";
import { AI_LIMITS } from "../config/aiConfig.js";

// ---------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long"),
  email: z.email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// ---------------------------------------------------------------
// Startup ideas (used for both submit and re-pitch)
// ---------------------------------------------------------------

export const ideaSchema = z.object({
  problem: z
    .string()
    .trim()
    .min(10, "Problem must be at least 10 characters long"),
  solution: z
    .string()
    .trim()
    .min(10, "Solution must be at least 10 characters long"),
  targetCustomer: z
    .string()
    .trim()
    .min(3, "Target customer must be at least 3 characters long"),
  roastLevel: z.enum(["Mild", "Medium", "Spicy"], {
    error: "Roast level must be Mild, Medium or Spicy",
  }),
});

// ---------------------------------------------------------------
// AI output (never trust the AI directly!)
// ---------------------------------------------------------------

// One investor review returned by the AI.
export const aiInvestorSchema = z.object({
  investorName: z.string().min(1, "Investor name is required"),
  score: z
    .number()
    .min(AI_LIMITS.MIN_SCORE, `Score must be at least ${AI_LIMITS.MIN_SCORE}`)
    .max(AI_LIMITS.MAX_SCORE, `Score must be at most ${AI_LIMITS.MAX_SCORE}`),
  roast: z.string().min(1, "Roast is required"),
  improvementTip: z.string().min(1, "Improvement tip is required"),
  fundingAmount: z
    .number()
    .min(0, "Funding cannot be negative")
    .max(AI_LIMITS.MAX_FUNDING, `Funding cannot exceed ${AI_LIMITS.MAX_FUNDING}`),
  equityPercentage: z
    .number()
    .min(AI_LIMITS.MIN_EQUITY, `Equity must be at least ${AI_LIMITS.MIN_EQUITY}%`)
    .max(AI_LIMITS.MAX_EQUITY, `Equity cannot exceed ${AI_LIMITS.MAX_EQUITY}%`),
});

// The full AI response must contain exactly three investor reviews.
export const aiResponseSchema = z.object({
  investors: z
    .array(aiInvestorSchema)
    .length(3, "There must be exactly 3 investor reviews"),
});

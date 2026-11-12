// config/aiConfig.js
// Responsibility: keep every AI-related limit in ONE easy-to-find place.
// If the assignment limits change, you only edit this file.

export const AI_LIMITS = {
  // Investor scores must be between these values.
  MIN_SCORE: 1,
  MAX_SCORE: 10,

  // Fictional funding offer cap (in PKR).
  MAX_FUNDING: 5000000,

  // Fictional equity must be inside this percentage range.
  MIN_EQUITY: 1,
  MAX_EQUITY: 30,

  // The exact three investors we require from the AI.
  INVESTORS: ["Strict Investor", "Funny Investor", "Dreamer Investor"],
};

// The Gemini model to use. You can override it with GEMINI_MODEL in .env.
// "gemini-3.5-flash" was verified to work with the project's API key.
export const AI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

// services/aiService.js
// Responsibility: talk to Google Gemini and return THREE validated investor
// reviews. This is the ONLY file that knows about Gemini, so the AI provider
// could be swapped later without touching the rest of the app.

import { GoogleGenerativeAI } from "@google/generative-ai";
import { AI_LIMITS, AI_MODEL } from "../config/aiConfig.js";
import { aiResponseSchema } from "../utils/validation.js";

// Builds the instruction text we send to the AI.
function buildPrompt(version) {
  return `You are simulating three fictional startup investors evaluating a startup idea.

Startup idea:
- Problem: ${version.problem}
- Solution: ${version.solution}
- Target Customer: ${version.targetCustomer}
- Roast Level: ${version.roastLevel}

Evaluate the idea with exactly these three investor personalities:

1. "Strict Investor": Focus on business reality. Ask hard questions about revenue, expenses, market size and competition. Point out weaknesses in the business model. Give one practical improvement tip.

2. "Funny Investor": Give humorous, entertaining feedback. Roast the idea according to the roast level (Mild = gentle teasing, Medium = cheeky, Spicy = savage but never offensive or hateful). Still include ONE genuinely useful business observation.

3. "Dreamer Investor": Focus on future potential, possible expansions and new opportunities. Explain how the idea could grow into a larger business. Give one practical improvement tip.

Respond with ONLY valid JSON in exactly this shape (no extra text, no markdown):
{
  "investors": [
    {
      "investorName": "Strict Investor",
      "score": <whole number from ${AI_LIMITS.MIN_SCORE} to ${AI_LIMITS.MAX_SCORE}>,
      "roast": "<short feedback, 1-3 sentences>",
      "improvementTip": "<one practical tip>",
      "fundingAmount": <number, 0 to ${AI_LIMITS.MAX_FUNDING}>,
      "equityPercentage": <number from ${AI_LIMITS.MIN_EQUITY} to ${AI_LIMITS.MAX_EQUITY}>
    },
    {
      "investorName": "Funny Investor",
      "score": <whole number from ${AI_LIMITS.MIN_SCORE} to ${AI_LIMITS.MAX_SCORE}>,
      "roast": "<short feedback, 1-3 sentences>",
      "improvementTip": "<one practical tip>",
      "fundingAmount": <number, 0 to ${AI_LIMITS.MAX_FUNDING}>,
      "equityPercentage": <number from ${AI_LIMITS.MIN_EQUITY} to ${AI_LIMITS.MAX_EQUITY}>
    },
    {
      "investorName": "Dreamer Investor",
      "score": <whole number from ${AI_LIMITS.MIN_SCORE} to ${AI_LIMITS.MAX_SCORE}>,
      "roast": "<short feedback, 1-3 sentences>",
      "improvementTip": "<one practical tip>",
      "fundingAmount": <number, 0 to ${AI_LIMITS.MAX_FUNDING}>,
      "equityPercentage": <number from ${AI_LIMITS.MIN_EQUITY} to ${AI_LIMITS.MAX_EQUITY}>
    }
  ]
}`;
}

// Some models wrap JSON in ```json ... ``` fences. Remove them if present.
function stripCodeFences(text) {
  let cleaned = text.trim();

  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(json)?/i, "");
    cleaned = cleaned.replace(/```$/, "");
    cleaned = cleaned.trim();
  }

  return cleaned;
}

// Check that all three expected investors are present (in any order).
function hasAllInvestors(investors) {
  const returnedNames = investors.map((investor) =>
    investor.investorName.toLowerCase()
  );

  for (const expectedName of AI_LIMITS.INVESTORS) {
    if (!returnedNames.includes(expectedName.toLowerCase())) {
      return false;
    }
  }

  return true;
}

// Put the investors back into the standard order: Strict, Funny, Dreamer.
function orderInvestors(investors) {
  const ordered = [];

  for (const expectedName of AI_LIMITS.INVESTORS) {
    for (const investor of investors) {
      if (investor.investorName.toLowerCase() === expectedName.toLowerCase()) {
        ordered.push({
          ...investor,
          investorName: expectedName, // use our exact spelling
        });
        break;
      }
    }
  }

  return ordered;
}

// One full attempt: ask the AI, parse the JSON, validate it with Zod.
async function requestReviewsFromGemini(version) {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error(
      "GEMINI_API_KEY is not configured. Add it to backend/.env and restart the server."
    );
    error.statusCode = 503;
    throw error;
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const model = genAI.getGenerativeModel({
    model: AI_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.9,
    },
  });

  const result = await model.generateContent(buildPrompt(version));
  const rawText = result.response.text();

  // 1) Parse the JSON text.
  let parsed;
  try {
    parsed = JSON.parse(stripCodeFences(rawText));
  } catch (error) {
    throw new Error("AI did not return valid JSON");
  }

  // 2) Validate the shape and every limit with Zod.
  const validation = aiResponseSchema.safeParse(parsed);

  if (!validation.success) {
    const messages = validation.error.issues.map((issue) => issue.message);
    throw new Error("AI returned invalid data: " + messages.join("; "));
  }

  // 3) Make sure all three personalities are present.
  if (!hasAllInvestors(validation.data.investors)) {
    throw new Error("AI did not return all three required investors");
  }

  return orderInvestors(validation.data.investors);
}

// Public function used by the controller.
// It tries once, and if that fails it retries once more.
export async function generateInvestorReviews(version) {
  // First attempt
  try {
    return await requestReviewsFromGemini(version);
  } catch (firstError) {
    console.log("AI attempt 1 failed:", firstError.message);
  }

  // Second (retry) attempt
  try {
    return await requestReviewsFromGemini(version);
  } catch (secondError) {
    console.log("AI attempt 2 failed:", secondError.message);

    const finalError = new Error(
      "AI evaluation failed after two attempts. " + secondError.message
    );
    finalError.statusCode = 502;
    throw finalError;
  }
}

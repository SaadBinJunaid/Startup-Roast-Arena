// controllers/reviewController.js
// Responsibility: generate AI reviews for an idea and read existing reviews.

import Idea from "../models/Idea.js";
import Review from "../models/Review.js";
import { generateInvestorReviews } from "../services/aiService.js";

// POST /api/ideas/:id/evaluate   (protected, owner only)
export async function evaluateIdea(req, res, next) {
  try {
    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({ message: "Idea not found" });
    }

    // Only the founder can trigger the AI evaluation for their idea.
    if (idea.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You can only evaluate your own idea",
      });
    }

    // Clear message if the AI key is missing - never pretend it worked.
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        message:
          "AI service is not configured. Add GEMINI_API_KEY to backend/.env and restart the server.",
      });
    }

    const latestVersion = idea.versions[idea.versions.length - 1];

    // Ask the AI (this already retries once and validates with Zod).
    const investors = await generateInvestorReviews(latestVersion);

    // Remove any earlier reviews for this version, so re-evaluating
    // does not create duplicates.
    await Review.deleteMany({
      idea: idea._id,
      versionNumber: idea.currentVersion,
    });

    // Save the three validated reviews.
    const savedReviews = [];

    for (const investor of investors) {
      const review = await Review.create({
        idea: idea._id,
        versionNumber: idea.currentVersion,
        investorName: investor.investorName,
        score: investor.score,
        roast: investor.roast,
        improvementTip: investor.improvementTip,
        fundingAmount: investor.fundingAmount,
        equityPercentage: investor.equityPercentage,
      });

      savedReviews.push(review);
    }

    return res.status(201).json({
      message: "Investor reviews generated successfully",
      reviews: savedReviews,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid idea id" });
    }
    // AI failures carry a statusCode (502 / 503) from the service.
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
}

// GET /api/ideas/:id/reviews        (public)
// Optional query: ?version=2 returns only that version's reviews.
export async function getReviews(req, res, next) {
  try {
    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({ message: "Idea not found" });
    }

    const filter = { idea: idea._id };

    if (req.query.version) {
      const versionNumber = Number(req.query.version);

      if (Number.isNaN(versionNumber)) {
        return res.status(400).json({ message: "Version must be a number" });
      }

      filter.versionNumber = versionNumber;
    }

    const reviews = await Review.find(filter).sort({ createdAt: 1 });

    return res.status(200).json({
      count: reviews.length,
      reviews: reviews,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid idea id" });
    }
    next(error);
  }
}

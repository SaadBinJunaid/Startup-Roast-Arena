// controllers/voteController.js
// Responsibility: handle community voting.
// All voting rules are enforced here on the BACKEND, not in the frontend.

import Idea from "../models/Idea.js";
import Vote from "../models/Vote.js";

// POST /api/ideas/:id/vote   (protected)
export async function voteIdea(req, res, next) {
  try {
    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({ message: "Idea not found" });
    }

    // RULE 1: You cannot vote for your own idea.
    if (idea.owner.toString() === req.user._id.toString()) {
      return res.status(403).json({
        message: "You cannot vote for your own idea",
      });
    }

    // RULE 2: One vote per user per idea.
    // The unique index in models/Vote.js throws code 11000 on a duplicate.
    try {
      await Vote.create({
        idea: idea._id,
        user: req.user._id,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          message: "You have already voted for this idea",
        });
      }
      throw error;
    }

    const voteCount = await Vote.countDocuments({ idea: idea._id });

    return res.status(201).json({
      message: "Vote recorded successfully",
      voteCount: voteCount,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid idea id" });
    }
    next(error);
  }
}

// GET /api/ideas/:id/votes   (public, but uses optional auth if a token exists)
export async function getVotes(req, res, next) {
  try {
    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({ message: "Idea not found" });
    }

    const voteCount = await Vote.countDocuments({ idea: idea._id });

    // If the request included a valid token, tell the frontend whether
    // this user has already voted and whether they own the idea.
    let hasVoted = false;
    let isOwner = false;

    if (req.user) {
      const existingVote = await Vote.findOne({
        idea: idea._id,
        user: req.user._id,
      });

      hasVoted = existingVote !== null;
      isOwner = idea.owner.toString() === req.user._id.toString();
    }

    return res.status(200).json({
      voteCount: voteCount,
      hasVoted: hasVoted,
      isOwner: isOwner,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid idea id" });
    }
    next(error);
  }
}

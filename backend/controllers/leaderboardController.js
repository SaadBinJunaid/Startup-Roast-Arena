// controllers/leaderboardController.js
// Responsibility: build the leaderboard using the documented formula:
//   finalScore = 0.7 * aiScore + 0.3 * voteScore
// where aiScore is the average of the LATEST version's reviews (1-10)
// and voteScore is normalized so the most-voted idea gets 10.

import Idea from "../models/Idea.js";
import Review from "../models/Review.js";
import Vote from "../models/Vote.js";

// Round to 2 decimals for clean display.
function round2(number) {
  return Math.round(number * 100) / 100;
}

// GET /api/leaderboard   (public)
export async function getLeaderboard(req, res, next) {
  try {
    const ideas = await Idea.find().populate("owner", "name");
    const reviews = await Review.find();
    const votes = await Vote.find();

    // 1) Count votes per idea.
    const voteCounts = {};

    for (const vote of votes) {
      const ideaId = vote.idea.toString();

      if (voteCounts[ideaId]) {
        voteCounts[ideaId] = voteCounts[ideaId] + 1;
      } else {
        voteCounts[ideaId] = 1;
      }
    }

    // 2) Find the highest vote count so we can normalize against it.
    let maxVotes = 0;

    for (const idea of ideas) {
      const count = voteCounts[idea._id.toString()] || 0;

      if (count > maxVotes) {
        maxVotes = count;
      }
    }

    // 3) Build one row per idea.
    const rows = [];

    for (const idea of ideas) {
      const latest = idea.versions[idea.versions.length - 1];

      // Only reviews for the CURRENT (latest) version count.
      const versionReviews = reviews.filter((review) => {
        return (
          review.idea.toString() === idea._id.toString() &&
          review.versionNumber === idea.currentVersion
        );
      });

      // Average AI score.
      let aiScore = 0;

      if (versionReviews.length > 0) {
        let total = 0;

        for (const review of versionReviews) {
          total = total + review.score;
        }

        aiScore = total / versionReviews.length;
      }

      // Normalized vote score (0-10).
      const voteCount = voteCounts[idea._id.toString()] || 0;
      let voteScore = 0;

      if (maxVotes > 0) {
        voteScore = (voteCount / maxVotes) * 10;
      }

      // Final blended score.
      const finalScore = 0.7 * aiScore + 0.3 * voteScore;

      rows.push({
        ideaId: idea._id,
        owner: idea.owner,
        problem: latest.problem,
        solution: latest.solution,
        targetCustomer: latest.targetCustomer,
        roastLevel: latest.roastLevel,
        currentVersion: idea.currentVersion,
        reviewCount: versionReviews.length,
        aiScore: round2(aiScore),
        voteCount: voteCount,
        voteScore: round2(voteScore),
        finalScore: round2(finalScore),
      });
    }

    // 4) Sort highest final score first.
    rows.sort((a, b) => b.finalScore - a.finalScore);

    // 5) Add a rank number.
    for (let i = 0; i < rows.length; i++) {
      rows[i].rank = i + 1;
    }

    return res.status(200).json({
      count: rows.length,
      leaderboard: rows,
    });
  } catch (error) {
    next(error);
  }
}

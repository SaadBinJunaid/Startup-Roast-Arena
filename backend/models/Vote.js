// models/Vote.js
// Responsibility: store one community vote (one user, one idea).
// The unique index below is the DATABASE-LEVEL guarantee that a user
// cannot vote twice for the same idea.

import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    idea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Idea",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// A user can vote only ONCE per idea. MongoDB enforces this for us.
voteSchema.index({ idea: 1, user: 1 }, { unique: true });

const Vote = mongoose.model("Vote", voteSchema);

export default Vote;

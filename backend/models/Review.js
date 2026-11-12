// models/Review.js
// Responsibility: store ONE AI investor review for a specific version of an idea.

import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    idea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Idea",
      required: true,
    },
    // Which idea version this review belongs to.
    versionNumber: {
      type: Number,
      required: true,
    },
    investorName: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    roast: {
      type: String,
      required: true,
    },
    improvementTip: {
      type: String,
      required: true,
    },
    fundingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    equityPercentage: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

const Review = mongoose.model("Review", reviewSchema);

export default Review;

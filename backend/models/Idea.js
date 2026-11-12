// models/Idea.js
// Responsibility: describe a startup idea and keep the full history of
// versions (so re-pitching never overwrites old content).

import mongoose from "mongoose";

// A single version of the idea (the original pitch or a re-pitch).
// We embed it inside the Idea document, so no extra collection is needed.
const versionSchema = new mongoose.Schema(
  {
    versionNumber: { type: Number, required: true },
    problem: { type: String, required: true, trim: true },
    solution: { type: String, required: true, trim: true },
    targetCustomer: { type: String, required: true, trim: true },
    roastLevel: {
      type: String,
      required: true,
      enum: ["Mild", "Medium", "Spicy"],
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false } // sub-documents do not need their own _id
);

const ideaSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The whole history of pitches. versions[0] is version 1.
    versions: {
      type: [versionSchema],
      default: [],
    },
    // Which version is currently active (the newest one).
    currentVersion: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

const Idea = mongoose.model("Idea", ideaSchema);

export default Idea;

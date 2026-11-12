// controllers/ideaController.js
// Responsibility: handle creating, listing, reading and re-pitching ideas.

import Idea from "../models/Idea.js";
import { ideaSchema } from "../utils/validation.js";

// Small helper: return a version in a clean shape for JSON responses.
function formatVersion(version) {
  return {
    versionNumber: version.versionNumber,
    problem: version.problem,
    solution: version.solution,
    targetCustomer: version.targetCustomer,
    roastLevel: version.roastLevel,
    createdAt: version.createdAt,
  };
}

// Small helper: the newest version is always the last item in the array.
function getLatestVersion(idea) {
  return idea.versions[idea.versions.length - 1];
}

// POST /api/ideas   (protected)
export async function createIdea(req, res, next) {
  try {
    const result = ideaSchema.safeParse(req.body);

    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      return res.status(400).json({ message: "Invalid input", errors: messages });
    }

    const { problem, solution, targetCustomer, roastLevel } = result.data;

    const idea = await Idea.create({
      owner: req.user._id,
      currentVersion: 1,
      versions: [
        {
          versionNumber: 1,
          problem: problem,
          solution: solution,
          targetCustomer: targetCustomer,
          roastLevel: roastLevel,
        },
      ],
    });

    return res.status(201).json({
      message: "Idea submitted successfully",
      idea: idea,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/ideas   (public)
export async function getIdeas(req, res, next) {
  try {
    // Newest first. populate() swaps the owner id for the owner's name.
    const ideas = await Idea.find().populate("owner", "name").sort({ createdAt: -1 });

    const formattedIdeas = [];

    for (const idea of ideas) {
      const latest = getLatestVersion(idea);

      formattedIdeas.push({
        id: idea._id,
        owner: idea.owner,
        currentVersion: idea.currentVersion,
        problem: latest.problem,
        solution: latest.solution,
        targetCustomer: latest.targetCustomer,
        roastLevel: latest.roastLevel,
        createdAt: idea.createdAt,
      });
    }

    return res.status(200).json({
      count: formattedIdeas.length,
      ideas: formattedIdeas,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/ideas/:id   (public)
export async function getIdea(req, res, next) {
  try {
    const idea = await Idea.findById(req.params.id).populate("owner", "name");

    if (!idea) {
      return res.status(404).json({ message: "Idea not found" });
    }

    const versions = idea.versions.map(formatVersion);

    return res.status(200).json({
      idea: {
        id: idea._id,
        owner: idea.owner,
        currentVersion: idea.currentVersion,
        versions: versions,
        createdAt: idea.createdAt,
        updatedAt: idea.updatedAt,
      },
    });
  } catch (error) {
    // A malformed id like "123" causes a CastError.
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid idea id" });
    }
    next(error);
  }
}

// PUT /api/ideas/:id/repitch   (protected, owner only)
export async function repitchIdea(req, res, next) {
  try {
    const result = ideaSchema.safeParse(req.body);

    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      return res.status(400).json({ message: "Invalid input", errors: messages });
    }

    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({ message: "Idea not found" });
    }

    // Ownership check: only the founder can re-pitch.
    if (idea.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You can only re-pitch your own idea",
      });
    }

    const { problem, solution, targetCustomer, roastLevel } = result.data;
    const newVersionNumber = idea.currentVersion + 1;

    // Push a NEW version. Old versions stay in the array untouched.
    idea.versions.push({
      versionNumber: newVersionNumber,
      problem: problem,
      solution: solution,
      targetCustomer: targetCustomer,
      roastLevel: roastLevel,
    });

    idea.currentVersion = newVersionNumber;

    await idea.save();

    return res.status(200).json({
      message: `Re-pitch submitted as version ${newVersionNumber}`,
      idea: idea,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid idea id" });
    }
    next(error);
  }
}

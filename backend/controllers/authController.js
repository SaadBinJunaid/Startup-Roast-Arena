// controllers/authController.js
// Responsibility: handle the three authentication actions:
//   registerUser -> create a new account
//   loginUser    -> check credentials and return a token
//   getMe        -> return the currently logged-in user
// Controllers receive (req, res, next) and send the JSON response.

import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { registerSchema, loginSchema } from "../utils/validation.js";
import generateToken from "../utils/generateToken.js";

// POST /api/auth/register
export async function registerUser(req, res, next) {
  try {
    // 1) Validate the body with Zod.
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      // Turn Zod's error list into an array of readable messages.
      const messages = result.error.issues.map((issue) => issue.message);

      return res.status(400).json({
        message: "Invalid input",
        errors: messages,
      });
    }

    const { name, email, password } = result.data;

    // 2) Reject an email that is already registered.
    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      return res.status(409).json({
        message: "This email is already registered",
      });
    }

    // 3) Hash the password. We never store the plain text version.
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4) Create the user.
    const user = await User.create({
      name: name,
      email: email,
      password: hashedPassword,
    });

    // 5) Respond with a token and safe user info (no password).
    return res.status(201).json({
      message: "User registered successfully",
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    // Hand unexpected errors to the central error handler.
    next(error);
  }
}

// POST /api/auth/login
export async function loginUser(req, res, next) {
  try {
    // 1) Validate the body with Zod.
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);

      return res.status(400).json({
        message: "Invalid input",
        errors: messages,
      });
    }

    const { email, password } = result.data;

    // 2) Find the user by email.
    const user = await User.findOne({ email: email });

    // We use ONE generic message so attackers cannot tell whether the
    // email exists. This is a small but good security habit.
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // 3) Compare the plain password with the stored hash.
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // 4) Success: return a fresh token.
    return res.status(200).json({
      message: "Login successful",
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/auth/me  (protected by the protect middleware)
export async function getMe(req, res, next) {
  try {
    // req.user was attached by the protect middleware.
    return res.status(200).json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

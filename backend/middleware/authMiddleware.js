// middleware/authMiddleware.js
// Responsibility: protect private routes.
// It checks the "Authorization: Bearer <token>" header, verifies the JWT,
// and loads the matching user onto req.user so controllers can use it.

import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  // 1) Make sure a Bearer token was actually sent.
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Not authorized, no token provided",
    });
  }

  try {
    // 2) "Bearer abc.def.ghi" -> take the part after the space.
    const token = authHeader.split(" ")[1];

    // 3) Verify the token with our secret. Throws if invalid/expired.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4) Load the user. ".select('-password')" leaves the hash out of req.user.
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "Not authorized, user no longer exists",
      });
    }

    // 5) Attach the user so the next controller can read req.user.
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Not authorized, token is invalid or expired",
    });
  }
}

// optionalAuth: used on PUBLIC routes that behave slightly differently when a
// user is logged in (for example GET /votes). If a valid token exists we set
// req.user; if not, we simply continue as a guest. We never block the request.
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (user) {
      req.user = user;
    }
  } catch (error) {
    // An invalid token is fine here - treat the request as a guest.
  }

  next();
}

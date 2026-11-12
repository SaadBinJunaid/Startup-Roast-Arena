// utils/generateToken.js
// Responsibility: create a signed JSON Web Token for a given user id.
// We keep it in one place so the same settings are used everywhere.

import jwt from "jsonwebtoken";

export default function generateToken(userId) {
  // The token stores the user id ("payload") and is signed with our secret.
  // It expires after 7 days, after which the user must log in again.
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

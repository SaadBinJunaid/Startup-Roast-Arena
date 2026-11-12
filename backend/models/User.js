// models/User.js
// Responsibility: describe the shape of a "user" document in MongoDB.
// Mongoose uses this schema to validate data before saving it.

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, // removes spaces at the start/end
    },
    email: {
      type: String,
      required: true,
      unique: true, // no two users can share an email
      lowercase: true, // always stored in lowercase
      trim: true,
    },
    password: {
      type: String,
      required: true, // this will always be the HASHED password
    },
  },
  {
    // Adds createdAt and updatedAt automatically.
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;

import User from "../models/User.js";
import { createAppError } from "../utils/createAppError.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (input) => {
  const existingUser = await User.findOne({ email: input.email })
  if (existingUser) {
    throw createAppError("User with this email already exists", 400);
  }

  const hash = await bcrypt.hash(input.password, 10);
  const newUser = await User.create({
    name: input.name,
    email: input.email,
    password: hash
  })
  const output = {
    id: newUser._id,
    name: newUser.name,
    email: newUser.email
  }
  return output;
}
// async function register (input) {
// }

export const login = async (input) => {
  const user = await User.findOne({ email: input.email });
  if (!user) {
    throw createAppError("Invalid email or password", 401);
  }
  const matching = await bcrypt.compare(input.password, user.password);
  if (!matching) {
    throw createAppError("Invalid email or password", 401);
  }
  const token = jwt.sign(
    { id: user._id }, // Data that goes in the token
    process.env.JWT_SECRET, // App's signature
    { expiresIn: "1h" }
  );
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  };
}
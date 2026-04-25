import User from "../models/User.js";
import { createAppError } from "../utils/createAppError.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (input) => {
  const name = String(input.name);
  const email = String(input.email);
  const password = String(input.password);

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    // Do not reveal whether the email is already registered — return the same
    // generic response as a successful registration to prevent user enumeration.
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  await User.create({
    name,
    email,
    password: hash,
  });
}
// async function register (input) {
// }

export const login = async (input) => {
  const email = String(input.email);
  const password = String(input.password);

  const user = await User.findOne({ email });
  if (!user) {
    throw createAppError("Invalid email or password", 401);
  }
  const matching = await bcrypt.compare(password, user.password);
  if (!matching) {
    throw createAppError("Invalid email or password", 401);
  }
  const token = jwt.sign(
    { userId: user._id }, // Data that goes in the token
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
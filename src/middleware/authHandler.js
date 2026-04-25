import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import User from "../models/User.js";
import { createAppError } from "../utils/createAppError.js";

const authHandler = async (req, res, next) => {
  const header = req.header('Authorization');
  if (!header) {
    throw createAppError("Authorization header missing", 401);
  }
  const token = header.replace("Bearer ", "");
  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw createAppError("Invalid token", 401);
  }
  const user = await User.findById(decoded.userId);
  if (!user) {
    throw createAppError("User not found", 404);
  }
  req.user = { userId: user._id };
  next();
};

export default authHandler;

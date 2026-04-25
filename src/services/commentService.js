import Comment from "../models/Comment.js";
import { createAppError } from "../utils/createAppError.js";

export const getCommentsByThread = async (threadId) => {
  const comments = await Comment.find({ thread: threadId }).populate("user", "name");
  // Return empty array if no comments exist (not an error condition)
  return comments;
};

export const createComment = async (thread, userId, content) => {
  const comment = await Comment.create({
    thread,
    user: userId,
    content,
  });
  const populatedComment =  await Comment.findById(comment._id).populate("user", "name");
  if (!populatedComment) {
    throw createAppError("Comment creation failed",500);
  }
  return populatedComment;
};
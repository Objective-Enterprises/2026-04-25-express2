import Thread from "../models/Thread.js";
import Comment from "../models/Comment.js";
import { createAppError } from "../utils/createAppError.js";

const voteHandler = async (Model, id, userId, type) => {
  const item = await Model.findById(id);
  const otherType = type === "upvote" ? "downvotedBy" : "upvotedBy";

  if (!item) throw createAppError("Item not found", 404);

  // Check if user already voted this way
  if (item[type + "dBy"].some((id) => id.toString() === userId.toString())) {
    return item;
  }

  // Push to correct array
  item[type + "dBy"].push(userId);

  // Remove from opposite array
  item[otherType] = item[otherType].filter(
    (id) => id.toString() !== userId.toString()
  );

  // Update counters
  item.upvotes = item.upvotedBy.length;
  item.downvotes = item.downvotedBy.length;
  item.voteCount = item.upvotes - item.downvotes;

  await item.save();
  return item;
};

export default voteHandler;

// Public service functions
export const upvoteThreadService = async (threadId, userId) => {
  const updated = await voteHandler(Thread, threadId, userId, "upvote");
  return {
    _id: updated._id,
    upvotes: updated.upvotes,
    downvotes: updated.downvotes,
    voteCount: updated.voteCount,
  };
};

export const downvoteThreadService = async (threadId, userId) => {
  const updated = await voteHandler(Thread, threadId, userId, "downvote");
  return {
    _id: updated._id,
    upvotes: updated.upvotes,
    downvotes: updated.downvotes,
    voteCount: updated.voteCount, 
  }
};

export const upvoteCommentService = async (commentId, userId) => {
  const updated = await voteHandler(Comment, commentId, userId, "upvote");
  return updated.populate("user", "name");
};

export const downvoteCommentService = async (commentId, userId) => {
  const updated = await voteHandler(Comment, commentId, userId, "downvote");
  return updated.populate("user", "name");
};
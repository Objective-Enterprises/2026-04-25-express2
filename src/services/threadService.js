import Thread from "../models/Thread.js";
import User from "../models/User.js";
import Subreddit from "../models/Subreddit.js";
import { createAppError } from "../utils/createAppError.js";

export const fetchAllThreads = async () => {
  const threads = await Thread.find()
    .populate({ path: "author", model: User })
    .populate({ path: "subreddit", model: Subreddit })
    .sort({ createdAt: -1 });

  if (threads.length === 0) {
    const error = createAppError("No threads found", 404);
    throw error
  }

  return threads;
};

export const fetchThreadById = async (id) => {
  const thread = await Thread.findById(id)
    .populate({ path: "author" })
    .populate({ path: "subreddit" });

  if (!thread) {
    throw createAppError("Thread not found", 404);
  }

  return thread;
};

export const createNewThread = async (title, content, author, subreddit) => {
  const newThread = new Thread({ title, content, author, subreddit });
  await newThread.save();

  const populatedThread = await Thread.findById(newThread._id)
    .populate({ path: "subreddit", select: "name description" })
    .populate({ path: "author", select: "name" });

  if (!populatedThread) {
    throw createAppError("Failed to create thread", 500);
  }

  return populatedThread;
};

const ALLOWED_THREAD_UPDATE_FIELDS = ["title", "content"];

export const updateThreadById = async (id, updateData, userId) => {
  const extraFields = Object.keys(updateData).filter(
    (key) => !ALLOWED_THREAD_UPDATE_FIELDS.includes(key),
  );
  if (extraFields.length > 0) {
    throw createAppError(
      `Only the following fields may be updated: ${ALLOWED_THREAD_UPDATE_FIELDS.join(", ")}. Disallowed fields: ${extraFields.join(", ")}`,
      400,
    );
  }

  const thread = await Thread.findById(id);
  if (!thread) {
    throw createAppError("Thread not found", 404);
  }
  if (thread.author.toString() !== userId.toString()) {
    throw createAppError("You are not allowed to update this thread", 403);
  }

  const sanitizedUpdate = {};
  for (const field of ALLOWED_THREAD_UPDATE_FIELDS) {
    if (updateData[field] !== undefined) {
      sanitizedUpdate[field] = String(updateData[field]);
    }
  }

  const updatedThread = await Thread.findByIdAndUpdate(id, sanitizedUpdate, {
    new: true,
    runValidators: true,
  });

  if (!updatedThread) {
    throw createAppError("Thread not found or update failed", 404);
  }

  return updatedThread;
};

export const deleteThreadById = async (id, userId) => {
  const thread = await Thread.findById(id);
  if (!thread) {
    throw createAppError("Thread not found", 404);
  }
  if (thread.author.toString() !== userId.toString()) {
    throw createAppError("You are not allowed to delete this thread", 403);
  }

  const deletedThread = await Thread.findByIdAndDelete(id);

  if (!deletedThread) {
    throw createAppError("Thread not found or delete failed", 404);
  }

  return deletedThread;
};

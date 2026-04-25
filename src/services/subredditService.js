import Subreddit from "../models/Subreddit.js";
import Thread from "../models/Thread.js";
import { createAppError } from "../utils/createAppError.js";

export const fetchAllSubreddits = async () => {
  const subreddits = await Subreddit.find();
  if (subreddits.length === 0) {
    throw createAppError("No subreddits found", 404);
  }
  return subreddits;
};

export const createNewSubreddit = async (name, description, author) => {
  const safeName = String(name);
  const safeDescription = String(description);

  const existingSubreddit = await Subreddit.findOne({ name: safeName });

  if (existingSubreddit) {
    throw createAppError("Subreddit with this name already exists", 400);
  }

  const newSubreddit = new Subreddit({
    name: safeName,
    description: safeDescription,
    author,
  });
  await newSubreddit.save();

  return newSubreddit;
};

export const fetchSubredditWithThreads = async (id) => {
  const subreddit = await Subreddit.findById(id);
  if (!subreddit) {
    throw createAppError("Subreddit not found", 404);
  }

  const threads = await Thread.find({ subreddit: id })
    .populate("author")
    .sort({ createdAt: -1 });

  return { subreddit, threads };
};

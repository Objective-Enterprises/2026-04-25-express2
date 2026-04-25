import Subreddit from "../models/Subreddit.js";
import Thread from "../models/Thread.js";
import { createAppError } from "../utils/createAppError.js";

export const fetchAllSubreddits = async () => {
  const subreddits = await Subreddit.find();
  // Add error handling for no subreddits found
  return subreddits;
};

export const createNewSubreddit = async (name, description, author) => {
  const existingSubreddit = await Subreddit.findOne({ name });

  // Add error handling for duplicate subreddit name

  const newSubreddit = new Subreddit({ name, description, author });
  await newSubreddit.save();

  return newSubreddit;
};

export const fetchSubredditWithThreads = async (id) => {
  const subreddit = await Subreddit.findById(id);
  // Add error handling for subreddit not found

  const threads = await Thread.find({ subreddit: id })
    .populate("author")
    .sort({ createdAt: -1 });

  return { subreddit, threads };
};

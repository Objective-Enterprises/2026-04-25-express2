import {
  fetchAllSubreddits,
  createNewSubreddit,
  fetchSubredditWithThreads,
} from "../services/subredditService.js";
import { createAppError } from "../utils/createAppError.js";

export const getAllSubreddits = async (req, res) => {
  const subreddits = await fetchAllSubreddits();
  res.status(200).json({
    success: true,
    message: "Subreddits fetched successfully",
    data: subreddits,
  });
};

export const createSubreddit = async (req, res) => {
  const { name, description } = req.body;
  const author = req.user.userId;

  if (!name || !description) {
    throw createAppError("Name and description are required.", 400);
  }

  const newSubreddit = await createNewSubreddit(name, description, author);
  res.status(201).json({
    success: true,
    message: "Subreddit created successfully",
    data: newSubreddit,
  });
};

export const getSubredditWithThreads = async (req, res) => {
  const { subreddit, threads } = await fetchSubredditWithThreads(req.params.id);
  res.status(200).json({
    success: true,
    message: "Subreddit and its threads fetched successfully",
    data: {
      subreddit,
      threads,
    },
  });
};

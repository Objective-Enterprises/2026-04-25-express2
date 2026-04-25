// scripts/populate_db.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Subreddit from "../models/Subreddit.js";
import Thread from "../models/Thread.js";
import Comment from "../models/Comment.js";
import { users, subreddits, threads, comments } from "./seed-data.js";

dotenv.config();

// Connect to DB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
}

// Clear collections
async function clearDatabase() {
  try {
    await Promise.all([
      User.deleteMany({}),
      Subreddit.deleteMany({}),
      Thread.deleteMany({}),
      Comment.deleteMany({}),
    ]);
    console.log("Cleared existing data");
  } catch (error) {
    console.error("Error clearing data:", error);
    throw error;
  }
}

// Insert users
async function insertUsers() {
  try {
    const createdUsers = await User.insertMany(users);
    console.log(`Inserted ${createdUsers.length} users`);
    return createdUsers;
  } catch (error) {
    console.error("Error inserting users:", error);
    throw error;
  }
}

// Insert subreddits
async function insertSubreddits() {
  try {
    const createdSubs = await Subreddit.insertMany(subreddits);
    console.log(`Inserted ${createdSubs.length} subreddits`);
    return createdSubs;
  } catch (error) {
    console.error("Error inserting subreddits:", error);
    throw error;
  }
}

// Create thread docs with proper subreddit references
function prepareThreadDocs(subredditMap) {
  return threads.map((thread) => ({
    _id: thread._id,
    title: thread.title,
    content: thread.content,
    author: thread.author,
    subreddit: subredditMap[thread.subredditName],
    upvotedBy: thread.upvotedBy,
    downvotedBy: thread.downvotedBy,
    voteCount:
      (thread.upvotedBy?.length || 0) - (thread.downvotedBy?.length || 0),
  }));
}

// Insert threads
async function insertThreads(subredditDocs) {
  try {
    const subredditMap = Object.fromEntries(
      subredditDocs.map((sub) => [sub.name, sub._id]),
    );
    const threadDocs = prepareThreadDocs(subredditMap);

    const createdThreads = await Thread.insertMany(threadDocs);
    console.log(`Inserted ${createdThreads.length} threads`);
    return createdThreads;
  } catch (error) {
    console.error("Error inserting threads:", error);
    throw error;
  }
}

// Insert comments
async function insertComments() {
  try {
    // Add voteCount = upvotedBy.length - downvotedBy.length
    const updatedComments = comments.map((comment) => ({
      ...comment,
      voteCount:
        (comment.upvotedBy?.length || 0) - (comment.downvotedBy?.length || 0),
    }));

    const createdComments = await Comment.insertMany(updatedComments);
    console.log(`Inserted ${createdComments.length} comments`);
  } catch (error) {
    console.error("Error inserting comments:", error);
    throw error;
  }
}

// Main seeding function
async function seedDatabase() {
  try {
    await connectToDatabase();
    await clearDatabase();

    const createdUsers = await insertUsers();
    const createdSubreddits = await insertSubreddits();
    await insertThreads(createdSubreddits);
    await insertComments();

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
}

seedDatabase();

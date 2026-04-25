import express from "express";
import {
  getAllSubreddits,
  createSubreddit,
  getSubredditWithThreads,
} from "../controllers/subredditController.js";
import authHandler from "../middleware/authHandler.js";
const router = express.Router();

router.get("/",authHandler, getAllSubreddits);
router.post("/",authHandler, createSubreddit);
router.get("/:id",authHandler, getSubredditWithThreads);

export default router;

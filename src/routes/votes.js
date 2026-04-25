import express from "express";
import authHandler from "../middleware/authHandler.js";
import {
  upvoteThread,
  downvoteThread,
  upvoteComment,
  downvoteComment,
} from "../controllers/voteController.js";

const router = express.Router();

router.post("/threads/:id/upvote", authHandler, upvoteThread);
router.post("/threads/:id/downvote", authHandler, downvoteThread);
router.post("/comments/:id/upvote", authHandler, upvoteComment);
router.post("/comments/:id/downvote", authHandler, downvoteComment);

export default router;

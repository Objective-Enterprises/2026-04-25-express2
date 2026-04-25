import express from "express";
import authHandler from "../middleware/authHandler.js";
import { addComment,fetchComments } from "../controllers/commentController.js";

const router = express.Router();

router.get("/thread/:threadId",authHandler, fetchComments);
router.post("/", authHandler, addComment);

export default router;
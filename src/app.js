import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import threadRoutes from "./routes/threads.js";
import subredditRoutes from "./routes/subreddits.js";
import auth from "./routes/auth.js";
import commentRoutes from "./routes/comments.js";
import voteRoutes from "./routes/votes.js";
import errorHandler from "./middleware/errorHandler.js";

import "./models/Thread.js";
import "./models/Subreddit.js";
import "./models/User.js";

const app = express();

// Security middlewares
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
app.use(limiter);

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(
  express.urlencoded({
    limit: "10mb",
    extended: true,
  }),
);

// Routes
app.use("/api/threads", threadRoutes);
app.use("/api/subreddits", subredditRoutes);
app.use("/api/auth", auth);
app.use("/api/comments", commentRoutes);
app.use("/api", voteRoutes);

app.use(errorHandler);

export default app;

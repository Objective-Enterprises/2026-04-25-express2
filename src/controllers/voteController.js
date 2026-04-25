import {
  upvoteThreadService,
  downvoteThreadService,
  upvoteCommentService,
  downvoteCommentService,
} from "../services/voteService.js";

export const upvoteThread = async (req, res) => {
  const updated = await upvoteThreadService(req.params.id, req.user.userId);
  res.status(200).json({
    success: true,
    message: "Thread upvoted successfully",
    data: updated,
  });
};

export const downvoteThread = async (req, res) => {
  const updated = await downvoteThreadService(req.params.id, req.user.userId);
  res.status(200).json({
    success: true,
    message: "Thread downvoted successfully",
    data: updated,
  });
};

export const upvoteComment = async (req, res) => {
  const updated = await upvoteCommentService(req.params.id, req.user.userId);
  res.status(200).json({
    success: true,
    message: "Comment upvoted successfully",
    data: updated,
  });
};

export const downvoteComment = async (req, res) => {
  const updated = await downvoteCommentService(req.params.id, req.user.userId);
  res.status(200).json({
    success: true,
    message: "Comment downvoted successfully",
    data: updated,
  });
};

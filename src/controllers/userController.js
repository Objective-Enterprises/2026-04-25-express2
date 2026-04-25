import * as userService from "../services/userService.js";

const getUserProfile = async (req, res, next) => {
  const userId = req.user.userId; // from authHandler middleware
  const user = await userService.getUserById(userId);
  res.status(200).json(user);
};

export { getUserProfile };

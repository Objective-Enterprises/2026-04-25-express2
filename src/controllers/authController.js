import { register, login } from "../services/authService.js";

const registerUser = async (req, res) => {
  await register(req.body);
  res.status(201).json({
    success: true,
    message: "If the details are valid, your account has been created. Please log in.",
  });
}

const loginUser = async (req, res) => {
  const result = await login(req.body);
  res.status(200).json({
    success: true,
    message: "User logged in successfully",
    data: result,
  });
}

export { registerUser, loginUser };
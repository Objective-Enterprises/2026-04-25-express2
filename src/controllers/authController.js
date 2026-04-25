import { register, login } from "../services/authService.js";

const registerUser = async (req, res) => {
  const user = await register(req.body);
  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: user,
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
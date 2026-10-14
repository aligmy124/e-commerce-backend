import { RequestHandler } from "express";
import { loginUser, registerUser } from "./auth.service";

export const registerController: RequestHandler = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    const user = await registerUser({
      email,
      password,
      firstName,
      lastName,
      phone,
    });
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (error) {
    console.error("🔥 REGISTER ERROR:", error);
    next(error);
  }
};

export const loginController: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await loginUser({ email, password });
    return res.status(201).json({
      success: true,
      message: "User logged in successfully",
      data: user,
    });
  } catch (error) {
    console.error("🔥 Login ERROR:", error);
    next(error);
  }
};

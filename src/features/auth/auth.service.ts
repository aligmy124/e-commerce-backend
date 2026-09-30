import { User } from "../../models/users/models/user.model";
import { RegisterUserInput } from "./types/register.type";
import bcrypt from "bcrypt";
import { Profile } from "../../models/profiles/models/profile.model";
import mongoose from "mongoose";
import { AppError } from "../../utils/AppError";
import { LoginUserInput } from "./types/login.type";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";

export const registerUser = async (data: RegisterUserInput) => {
  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const existingUser = await User.findOne({
      email: data.email,
    }).session(session);

    if (existingUser) {
      throw new AppError("Email already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await User.create(
      [
        {
          email: data.email,
          password: hashedPassword,
        },
      ],
      { session },
    );

    const profile = await Profile.create(
      [
        {
          userId: user[0]._id,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
        },
      ],
      { session },
    );
    if (!profile) {
      throw new AppError("Profile creation failed", 500);
    }
    await session.commitTransaction();

    return {
      id: user[0]._id,
      email: user[0].email,
      role: user[0].role,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

export const loginUser = async (data: LoginUserInput) => {
  const user = await User.findOne({ email: data.email }).select("+password");
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = jwt.sign({ id: user._id, role: user.role }, env.JWT_SECRET, {
    expiresIn: "1h",
  });

  return {
    id: user._id,
    email: user.email,
    role: user.role,
    token,
  };
};

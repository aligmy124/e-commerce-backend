import { RequestHandler } from "express";
import { fetchUsers, userProfile } from "./users.service";

export const fetchUsersController: RequestHandler = async (req, res, next) => {
  try {
    const users = await fetchUsers();
    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

export const userProfileController: RequestHandler<{ userId: string }> = async (
  req,
  res,
  next,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { userId } = req.params;
    const { id: loggedUser, role } = req.user;
    if (loggedUser.toString() !== userId && role !== "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden: You do not have permission to access this resource",
      });
    }
    const user = await userProfile(userId);

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

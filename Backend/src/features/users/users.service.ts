import { logger } from "../../config/logger";
import { User } from "../../models/users/models/user.model";
import { AppError } from "../../utils/AppError";

export const fetchUsers = async () => {
  const users = await User.find();
  if (!users) {
    throw new AppError("there are not users", 200);
  }
  return users;
};
export const userProfile = async (userId: string) => {
  const user = await User.findById(userId);
  logger.info(user);

  if (!user) {
    throw new AppError("user not found", 401);
  }
  return user;
};

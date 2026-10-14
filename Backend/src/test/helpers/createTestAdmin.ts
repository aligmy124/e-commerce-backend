import { User } from "../../models/users/models/user.model";
import { Profile } from "../../models/profiles/models/profile.model";
import bcrypt from "bcrypt";

export const createTestAdmin = async () => {
  const password = "password123";

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    email: `admin-${Date.now()}@example.com`,
    password: hashedPassword,
    role: "admin",
  });

  await Profile.create({
    userId: user._id,
    firstName: "Test",
    lastName: "Admin",
    phone: "+201000000001",
  });

  return {
    user,
    password,
  };
};

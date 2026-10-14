import bcrypt from "bcrypt";
import { User } from "../models/users/models/user.model";
import { Profile } from "../models/profiles/models/profile.model";

export const createAdmin = async () => {
  const password = "password123";
  const hashedPassword = await bcrypt.hash(password, 12);

  // ✅ تحقق لو الأدمن موجود بالفعل
  const existingAdmin = await User.findOne({ email: "admin77@example.com" });
  if (existingAdmin) {
    return {
      success: false,
      message: "Admin already exists",
      user: existingAdmin,
    };
  }

  const user = await User.create({
    email: "admin77@example.com",
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
    success: true,
    message: "Admin created successfully",
    data: {
      user,
      plainPassword: password,
    },
  };
};

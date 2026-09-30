import mongoose, { Schema, Model } from "mongoose";

export interface IProfile {
  userId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  phone: string;
  avatar: string;
}

const ProfileSchema: Schema<IProfile> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      minlength: [3, "First name must be at least 3 characters"],
      maxlength: [50, "First name must be at most 50 characters"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      minlength: [3, "Last name must be at least 3 characters"],
      maxlength: [50, "Last name must be at most 50 characters"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^\+?[0-9]{10,15}$/, "Please enter a valid phone number"], 
      trim: true,
    },
    avatar: {
      type: String,
      default: "https://example.com/default-avatar.png", 
      trim: true,
    },
  },
  {
    timestamps: true
  }
);

ProfileSchema.index({userId: 1}, {unique:true});

export const Profile: Model<IProfile> = mongoose.model<IProfile>(
  "Profile",
  ProfileSchema
);

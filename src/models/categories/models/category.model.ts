import mongoose, { Model, Schema} from "mongoose";

export interface ICategory {
  name: string;
  description: string;
  isActive: boolean;
}

const CategorySchema: Schema<ICategory> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [20, "Name must be at most 20 characters"],
      trim: true,
      unique: true
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [500, "Description must be at most 500 characters"],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Category: Model<ICategory> = mongoose.model<ICategory>(
  "Category",
  CategorySchema
);

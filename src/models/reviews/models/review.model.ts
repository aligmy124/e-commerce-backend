import mongoose, { Schema, Model } from "mongoose";

export interface IReview {
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
}

const ReviewSchema: Schema<IReview> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating cannot be less than 1"],
      max: [5, "Rating cannot be more than 5"],
    },
    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
      minlength: [4, "Comment must be at least 4 characters"],
      maxlength: [500, "Comment must be at most 500 characters"],
    },
  },
  {
    timestamps: true,
  },
);

ReviewSchema.index({userId: 1 , productId: 1}, {unique: true});

export const Review: Model<IReview> = mongoose.model<IReview>(
  "Review",
  ReviewSchema,
);

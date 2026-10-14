import mongoose, { Schema, Model } from "mongoose";

export interface IProductImage {
  url: string;
  alt: string;
  publicId: string;
}

export interface IProduct {
  name: string;
  description: string;
  brand: string;
  price: number;
  stock: number;
  isActive: boolean;
  categoryId: mongoose.Types.ObjectId;
  images: IProductImage[];
  averageRating: number;
  reviewsCount: number;
}

const ProductSchema: Schema<IProduct> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [100, "Name must be at most 100 characters"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [500, "Description must be at most 500 characters"],
      trim: true,
    },

    brand: {
      type: String,
      required: [true, "Brand is required"],
      trim: true,
    },

    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },

    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },

    images: {
      type: [
        {
          url: {
            type: String,
            required: [true, "Image URL is required"],
            trim: true,
          },
          alt: {
            type: String,
            required: [true, "Image alt text is required"],
            trim: true,
          },
          publicId: {
            type: String,
            required: [true, "Image public ID is required"],
            trim: true,
          },
        },
      ],

      validate: {
        validator: (arr: IProductImage[]) => arr.length <= 10,
        message: "You can upload up to 10 images only",
      },

      default: [],
    },

    averageRating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be less than 0"],
      max: [5, "Rating cannot be more than 5"],
    },

    reviewsCount: {
      type: Number,
      default: 0,
      min: [0, "Reviews count cannot be negative"],
    },
  },
  {
    timestamps: true,
  },
);

export const Product: Model<IProduct> = mongoose.model<IProduct>(
  "Product",
  ProductSchema,
);

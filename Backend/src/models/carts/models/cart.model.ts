import mongoose, { Schema, Model } from "mongoose";

export interface ICartItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
}

export interface ICart {
  userId: mongoose.Types.ObjectId;
  cartItems: ICartItem[];
}

const CartSchema: Schema<ICart> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cartItems: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, "Quantity must be at least 1"],
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

CartSchema.index({ userId: 1 }, { unique: true });

export const Cart: Model<ICart> = mongoose.model<ICart>("Cart", CartSchema);

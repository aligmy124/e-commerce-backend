import mongoose, { Schema, Model } from "mongoose";

export interface IShippingAddress {
  fullName: string;
  phone: string;
  country: string;
  city: string;
  street: string;
  postalCode: string;
}
export interface IOrder {
  userId: mongoose.Types.ObjectId;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled" | "refunded";
  totalPrice: number;
  shippingAddress: IShippingAddress;
}

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [3, "Full name must be at least 3 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^\+?[0-9]{10,15}$/, "Please enter a valid phone number"],
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    street: {
      type: String,
      required: true,
      trim: true,
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const OrderSchema: Schema<IOrder> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending" , "paid" , "shipped" , "delivered" ,  "cancelled", "refunded"],
      default: "pending",
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, "Total price cannot be negative"],
    },
    shippingAddress: {
      type: ShippingAddressSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Order: Model<IOrder> = mongoose.model<IOrder>("Order", OrderSchema);

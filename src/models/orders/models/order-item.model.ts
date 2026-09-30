import mongoose, { Schema, Model } from "mongoose";

export interface IOrderItem {
  orderId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

const OrderItemSchema: Schema<IOrderItem> = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
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
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },
  },
);

OrderItemSchema.index({ orderId: 1, productId: 1 }, { unique: true });

export const OrderItem: Model<IOrderItem> = mongoose.model<IOrderItem>(
  "OrderItem",
  OrderItemSchema
);

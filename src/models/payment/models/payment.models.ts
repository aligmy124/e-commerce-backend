import mongoose, { Schema, Model } from "mongoose";

export interface IPayment {
  orderId: mongoose.Types.ObjectId;
  amount: number;
  method: "credit_card" | "paypal" | "cash" | "bank_transfer";
  status: "pending" | "paid" | "failed" |"refund_processing" | "refunded";
  transactionId?: string; 
  paidAt?: Date;
}

const PaymentSchema: Schema<IPayment> = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount cannot be negative"],
    },
    method: {
      type: String,
      enum: ["credit_card", "paypal", "cash", "bank_transfer"],
      required: true,
    },
    status: {
      type: String,
      enum: [ "pending", "paid", "failed", "refund_processing", "refunded"],
      default: "pending",
    },
    transactionId: {
      type: String,
      unique: true,
      trim: true,
      sparse: true, 
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true
  }
);

export const Payment: Model<IPayment> = mongoose.model<IPayment>(
  "Payment",
  PaymentSchema
);

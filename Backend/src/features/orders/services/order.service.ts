/*
 Create Order ✅
Get My Orders ✅
Get My Order By ID ← ده اللي بعده
Cancel Order
Admin Get All Orders
Admin Update Order Status
Payment
 */

import mongoose from "mongoose";
import { Cart } from "../../../models/carts/models/cart.model";
import { AppError } from "../../../utils/AppError";
import {
  IShippingAddress,
  Order,
} from "../../../models/orders/models/order.model";
import { Product } from "../../../models/products/models/product.model";
import { OrderItem } from "../../../models/orders/models/order-item.model";

interface ICreateOrder {
  shippingAddress: IShippingAddress;
}

type OrderStatus = "pending" | "paid" | "cancelled" | "refunded";
type ManualOrderStatus = "cancelled";
export const createOrder = async (userId: string, data: ICreateOrder) => {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      const cart = await Cart.findOne({ userId }).session(session);
      if (!cart) throw new AppError("You don't have a cart yet", 404);
      if (cart.cartItems.length === 0) throw new AppError("Cart is empty", 400);

      const productIds = cart.cartItems.map((item) => item.productId);
      const products = await Product.find({ _id: { $in: productIds } }).session(
        session,
      );

      if (products.length !== cart.cartItems.length) {
        throw new AppError("One or more products are no longer available", 400);
      }

      const productsMap = new Map(products.map((p) => [p._id.toString(), p]));

      const orderItems = cart.cartItems.map((cartItem) => {
        const product = productsMap.get(cartItem.productId.toString());
        if (!product) {
          if (!product) {
            throw new AppError("Product data is inconsistent", 500);
          }
        }
        if (!product.isActive) {
          throw new AppError(
            `Product ${cartItem.productId} is not available`,
            404,
          );
        }
        if (product.stock < cartItem.quantity) {
          throw new AppError(
            `Insufficient stock for product ${product.name}`,
            400,
          );
        }
        return {
          productId: product._id,
          quantity: cartItem.quantity,
          price: product.price,
        };
      });

      // Bulk update stock
      const bulkOps = orderItems.map((item) => ({
        updateOne: {
          filter: { _id: item.productId, stock: { $gte: item.quantity } },
          update: { $inc: { stock: -item.quantity } },
        },
      }));
      const bulkResult = await Product.bulkWrite(bulkOps, { session });
      if (bulkResult.matchedCount !== orderItems.length) {
        throw new AppError("Insufficient stock for one or more products", 400);
      }

      const totalPrice = orderItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      );

      const [order] = await Order.create(
        [
          {
            userId,
            status: "pending",
            totalPrice,
            shippingAddress: {
              fullName: data.shippingAddress.fullName,
              phone: data.shippingAddress.phone,
              country: data.shippingAddress.country,
              city: data.shippingAddress.city,
              street: data.shippingAddress.street,
              postalCode: data.shippingAddress.postalCode,
            },
          },
        ],
        { session },
      );

      await OrderItem.insertMany(
        orderItems.map((item) => ({ ...item, orderId: order._id })),
        { session },
      );

      cart.cartItems = [];
      await cart.save({ session });

      // Populate user or products if needed
      await order.populate("userId");

      return order;
    });
  } finally {
    await session.endSession();
  }
};
export const getMyOrders = async (userId: string) => {
  const result = await Order.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
      },
    },

    {
      $lookup: {
        from: "orderitems",
        localField: "_id",
        foreignField: "orderId",
        as: "orderItem",
      },
    },

    {
      $unwind: "$orderItem",
    },

    {
      $lookup: {
        from: "products",
        localField: "orderItem.productId",
        foreignField: "_id",
        as: "product",
      },
    },

    {
      $unwind: "$product",
    },

    {
      $group: {
        _id: "$_id",
        status: { $first: "$status" },
        totalPrice: { $first: "$totalPrice" },
        createdAt: { $first: "$createdAt" },

        items: {
          $push: {
            product: {
              name: "$product.name",
              price: "$product.price",
            },
            quantity: "$orderItem.quantity",
          },
        },
      },
    },

    {
      $sort: {
        createdAt: -1,
      },
    },

    {
      $project: {
        _id: 0,
        id: "$_id",
        status: 1,
        totalPrice: 1,
        createdAt: 1,
        items: 1,
      },
    },
  ]);

  return {
    orders: result,
  };
};
export const getMyOrder = async (
  orderId: string,
  userId: string,
) => {
  const result = await Order.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        _id: new mongoose.Types.ObjectId(orderId),
      },
    },

    {
      $lookup: {
        from: "orderitems",
        localField: "_id",
        foreignField: "orderId",
        as: "orderItems",
      },
    },

    {
      $unwind: "$orderItems",
    },

    {
      $lookup: {
        from: "products",
        localField: "orderItems.productId",
        foreignField: "_id",
        as: "product",
      },
    },

    {
      $unwind: "$product",
    },

    {
      $group: {
        _id: "$_id",

        status: {
          $first: "$status",
        },

        totalPrice: {
          $first: "$totalPrice",
        },

        shippingAddress: {
          $first: "$shippingAddress",
        },

        createdAt: {
          $first: "$createdAt",
        },

        items: {
          $push: {
            product: {
              name: "$product.name",
              price: "$product.price",
            },
            quantity: "$orderItems.quantity",
            price: "$orderItems.price",
          },
        },
      },
    },

    {
      $project: {
        _id: 0,
        id: "$_id",
        status: 1,
        totalPrice: 1,
        shippingAddress: 1,
        createdAt: 1,
        items: 1,
      },
    },
  ]);

  return result[0] ?? null;
};
export const cancelOrder = async (orderId: string, userId: string) => {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      const order = await Order.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        _id: new mongoose.Types.ObjectId(orderId),
        status: "pending",
      }).session(session);

      if (!order) {
        throw new AppError("Order not found or cannot be cancelled", 400);
      }

      const orderItems = await OrderItem.find({
        orderId: order._id,
      }).session(session);

      if (orderItems.length === 0) {
        throw new AppError("Order has no items", 500);
      }

      const productIds = orderItems.map((item) => item.productId);

      const products = await Product.find({
        _id: { $in: productIds },
      }).session(session);

      const productsMap = new Map(
        products.map((product) => [product._id.toString(), product]),
      );

      const operations = orderItems.map((item) => {
        const product = productsMap.get(item.productId.toString());

        if (!product) {
          throw new AppError("Product data is inconsistent", 500);
        }

        return {
          updateOne: {
            filter: {
              _id: product._id,
            },
            update: {
              $inc: {
                stock: item.quantity,
              },
            },
          },
        };
      });

      await Product.bulkWrite(operations, { session });

      order.status = "cancelled";

      await order.save({ session });

      return order;
    });
  } finally {
    await session.endSession();
  }
};
export const allOrders = async (page = 1, limit = 10, status?: OrderStatus) => {
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (status) {
    filter.status = status;
  }

  const result = await Order.aggregate([
    {
      $match: filter,
    },

    {
      $lookup: {
        from: "orderitems",
        localField: "_id",
        foreignField: "orderId",
        as: "orderItems",
      },
    },

    {
      $unwind: "$orderItems",
    },

    {
      $lookup: {
        from: "products",
        localField: "orderItems.productId",
        foreignField: "_id",
        as: "product",
      },
    },

    {
      $unwind: "$product",
    },

    {
      $group: {
        _id: "$_id",

        status: { $first: "$status" },

        totalPrice: {
          $first: "$totalPrice",
        },

        shippingAddress: {
          $first: "$shippingAddress",
        },

        items: {
          $push: {
            product: {
              name: "$product.name",
            },

            quantity: "$orderItems.quantity",

            price: "$orderItems.price",
          },
        },
      },
    },

    {
      $sort: {
        _id: -1,
      },
    },

    {
      $facet: {
        orders: [
          { $skip: skip },
          { $limit: limit },

          {
            $project: {
              _id: 0,
              id: "$_id",
              status: 1,
              totalPrice: 1,
              shippingAddress: 1,
              items: 1,
            },
          },
        ],

        metadata: [
          {
            $count: "total",
          },
        ],
      },
    },
  ]);

  const orders = result[0]?.orders ?? [];

  const total = result[0]?.metadata[0]?.total ?? 0;

  return {
    orders,

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const updateOrderStatus = async (
  orderId: string,
  status: ManualOrderStatus,
) => {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      // نفس الحالة
      if (order.status === status) {
        throw new AppError(`Order is already ${status}`, 400);
      }

      // Only pending orders can be manually cancelled
      if (status === "cancelled" && order.status !== "pending") {
        throw new AppError(
          "Only pending orders can be cancelled manually",
          400,
        );
      }

      if (status === "cancelled") {
        const orderItems = await OrderItem.find({
          orderId: order._id,
        }).session(session);

        if (!orderItems.length) {
          throw new AppError("Order has no items", 500);
        }

        const operations = orderItems.map((item) => ({
          updateOne: {
            filter: {
              _id: item.productId,
            },
            update: {
              $inc: {
                stock: item.quantity,
              },
            },
          },
        }));

        await Product.bulkWrite(operations, { session });
      }

      order.status = status;

      await order.save({ session });

      return order;
    });
  } finally {
    await session.endSession();
  }
};

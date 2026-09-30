import { RequestHandler } from "express";
import {
  allOrders,
  cancelOrder,
  createOrder,
  getMyOrder,
  getMyOrders,
  updateOrderStatus,
} from "../services/order.service";
type OrderStatus =
  | "pending"
  | "paid"
  | "cancelled"
  | "refunded";
export const createOrderController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const order = await createOrder(req.user.id, req.body);
    return res.status(201).json({
      success: true,
      message: "Order has been placed successfully",
      orderId: order._id,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrdersController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const myOrders = await getMyOrders(req.user.id);
    return res.status(200).json({
      success: true,
      data: myOrders,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrderController: RequestHandler<{ orderId: string }> = async (
  req,
  res,
  next,
) => {
  try {
    const { orderId } = req.params;
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const myOrder = await getMyOrder(orderId, req.user.id);
    return res.status(200).json({
      success: true,
      data: myOrder,
    });
  } catch (error) {
    next(error);
  }
};
export const cancelOrderController: RequestHandler<{
  orderId: string;
}> = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    await cancelOrder(orderId, req.user.id);
    return res.status(200).json({
      success: true,
      message: "order canceled successfully",
    });
  } catch (error) {
    next(error);
  }
};
export const allOrdersController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit =Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      100,
    );
    const status= req.query.status as OrderStatus | undefined;
    const orders = await allOrders(page, limit, status);

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};
export const updateOrderStatusController: RequestHandler<{
  orderId: string;
}> = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const { status } = req.body;

    const order = await updateOrderStatus(
      orderId,
      status,
    );

    return res.status(200).json({
      success: true,
      message: "status updated successfully"
    });
  } catch (error) {
    next(error);
  }
};


/*
export const getOrderController: RequestHandler<{ orderId: string }> = async (
  req,
  res,
  next,
) => {
  try {
    const { orderId } = req.params;
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const responseOrder = await getOrderById(orderId, req.user.id);
    return res.status(200).json({
      success: true,
      data: responseOrder,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderController: RequestHandler<{
  orderId: string;
}> = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    await updateOrder(orderId, req.user.id);
  } catch (error) {
    next(error);
  }
};
*/

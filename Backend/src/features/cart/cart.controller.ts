import { RequestHandler } from "express";
import {
  addToCart,
  clearCart,
  deleteCartItem,
  getCart,
  getCartSummary,
  updateCart,
} from "./cart.service";

const getUserId = (req: Express.Request) => {
  if (!req.user) {
    throw new Error("Unauthorized");
  }

  return req.user.id;
};

export const addToCartController: RequestHandler<{
  productId: string;
}> = async (req, res, next) => {
  try {
    const cart = await addToCart(
      req.params.productId,
      getUserId(req),
      req.body,
    );

    return res.status(201).json({
      success: true,
      message: "Product added to cart successfully",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const getCartController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const cart = await getCart(getUserId(req));

    return res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const getCartSummaryController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const summary = await getCartSummary(getUserId(req));

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartController: RequestHandler<{
  productId: string;
}> = async (req, res, next) => {
  try {
    const cart = await updateCart(
      req.params.productId,
      getUserId(req),
      req.body,
    );

    return res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCartItemController: RequestHandler<{
  productId: string;
}> = async (req, res, next) => {
  try {
    const cart = await deleteCartItem(
      req.params.productId,
      getUserId(req),
    );

    return res.status(200).json({
      success: true,
      message: "Product removed from cart successfully",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const clearCartController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const cart = await clearCart(getUserId(req));

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};
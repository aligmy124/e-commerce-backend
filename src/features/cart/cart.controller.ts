// import { RequestHandler } from "express";
// import { addToCart, clearCart, deleteCartItems, getCart, updateCart } from "./cart.service";

// export const addToCartController: RequestHandler<{
//   productId: string;
// }> = async (req, res, next) => {
//   try {
//     const { productId } = req.params;
//     const { quantity } = req.body;
//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       });
//     }
//     const cart = await addToCart(productId, req.user.id, {
//       quantity,
//     });

//     return res.status(201).json({
//       success: true,
//       message: "product added to cart",
//       data: cart,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const getCartController: RequestHandler = async (req, res, next) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       });
//     }

//     const cart = await getCart(req.user.id);
//     return res.status(200).json({
//       success: true,
//       data: cart,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
// export const updateCartController: RequestHandler<{
//   productId: string;
// }> = async (req, res, next) => {
//   try {
//     const { productId } = req.params;
//     const { quantity } = req.body;
//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       });
//     }

//     await updateCart(productId, req.user.id, {
//       quantity,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "update cart items successfully",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const deleteCartItemsController: RequestHandler<{productId: string}> = async (
//   req,
//   res,
//   next,
// ) => {
//   try {
//     const { productId } = req.params;
//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       });
//     }
//     await deleteCartItems(productId, req.user.id);
//     return res.status(200).json({
//       success: true,
//       message: "product deleted from cart"
//     })
//   } catch (error) {
//     next(error);
//   }
// };
// export const clearCartController: RequestHandler = async (
//   req,
//   res,
//   next,
// ) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       });
//     }

//     await clearCart(req.user.id);

//     return res.status(200).json({
//       success: true,
//       message: "Cart cleared successfully",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

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
// import { AppError } from "../../utils/AppError";
// import { Cart } from "../../models/carts/models/cart.model";
// import { Product } from "../../models/products/models/product.model";

// interface IQuantity {
//   quantity: number;
// }

// export const addToCart = async (
//   productId: string,
//   userId: string,
//   data: IQuantity,
// ) => {
//   const product = await Product.findById(productId);

//   if (!product) {
//     throw new AppError("product not found", 404);
//   }

//   if (!product.isActive) {
//     throw new AppError("product not available", 404);
//   }

//   let cart = await Cart.findOne({ userId });

//   if (!cart) {
//     cart = await Cart.create({
//       userId,
//       cartItems: [
//         {
//           productId: product._id,
//           quantity: data.quantity,
//         },
//       ],
//     });

//     return cart;
//   }

//   const existingItem = cart.cartItems.find(
//     (item) => item.productId.toString() === productId,
//   );

//   if (existingItem) {
//     existingItem.quantity += data.quantity;
//   } else {
//     cart.cartItems.push({
//       productId: product._id,
//       quantity: data.quantity,
//     });
//   }

//   await cart.save();

//   return cart;
// };

// export const getCart = async (userId: string) => {
//   const cart = await Cart.findOne({ userId }).populate(
//     "cartItems.productId",
//     "name brand price isActive images",
//   );
//   if (!cart) {
//     throw new AppError("You don't have a cart yet", 404);
//   }
//   return cart;
// };
// export const updateCart = async (
//   productId: string,
//   userId: string,
//   data: IQuantity,
// ) => {
//   const cart = await Cart.findOne({ userId });

//   if (!cart) {
//     throw new AppError("You don't have a cart yet", 404);
//   }

//   const productCart = cart.cartItems.find(
//     (item) => item.productId.toString() === productId,
//   );

//   if (!productCart) {
//     throw new AppError("product not found in cart", 404);
//   }

//   productCart.quantity = data.quantity;

//   await cart.save();

//   return cart;
// };
// export const deleteCartItems = async (productId: string, userId: string) => {
//   const cart = await Cart.findOne({ userId });
//   if (!cart) {
//     throw new AppError("You don't have a cart yet", 404);
//   }
//   const productCart = cart.cartItems.find(
//     (item) => item.productId.toString() === productId,
//   );
//   if (!productCart) {
//     throw new AppError("product not found in cart", 404);
//   }

//   cart.cartItems = cart.cartItems.filter(
//     (item) => item.productId.toString() !== productId,
//   );
//   await cart.save();
//   return cart;
// };
// export const clearCart = async (userId: string) => {
//   const cart = await Cart.findOne({ userId });
//   if (!cart) {
//     throw new AppError("You don't have a cart yet", 404);
//   }

//   cart.cartItems = [];
//   await cart.save();
//   return cart;
// };

import { Cart } from "../../models/carts/models/cart.model";
import { Product } from "../../models/products/models/product.model";
import { AppError } from "../../utils/AppError";

interface IQuantity {
  quantity: number;
}

const validateQuantity = (quantity: number): void => {
  if (!quantity || quantity < 1) {
    throw new AppError("Quantity must be greater than 0", 400);
  }
};

const validateProduct = async (productId: string) => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (!product.isActive) {
    throw new AppError("Product is unavailable", 400);
  }

  return product;
};

const findCartByUser = async (userId: string) => {
  const cart = await Cart.findOne({ userId });

  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  return cart;
};

export const addToCart = async (
  productId: string,
  userId: string,
  { quantity }: IQuantity,
) => {
  validateQuantity(quantity);

  const product = await validateProduct(productId);

  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = await Cart.create({
      userId,
      cartItems: [
        {
          productId: product._id,
          quantity,
        },
      ],
    });

    return cart;
  }

  const existingItem = cart.cartItems.find(
    (item) => item.productId.toString() === productId,
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.cartItems.push({
      productId: product._id,
      quantity,
    });
  }

  await cart.save();

  return cart;
};

export const getCart = async (userId: string) => {
  const cart = await Cart.findOne({ userId }).populate(
    "cartItems.productId",
    "name brand price isActive images",
  );

  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  return cart;
};

export const updateCart = async (
  productId: string,
  userId: string,
  { quantity }: IQuantity,
) => {
  validateQuantity(quantity);

  const cart = await findCartByUser(userId);

  const cartItem = cart.cartItems.find(
    (item) => item.productId.toString() === productId,
  );

  if (!cartItem) {
    throw new AppError("Product not found in cart", 404);
  }

  cartItem.quantity = quantity;

  await cart.save();

  return cart;
};

export const deleteCartItem = async (
  productId: string,
  userId: string,
) => {
  const cart = await findCartByUser(userId);

  const itemExists = cart.cartItems.some(
    (item) => item.productId.toString() === productId,
  );

  if (!itemExists) {
    throw new AppError("Product not found in cart", 404);
  }

  cart.cartItems = cart.cartItems.filter(
    (item) => item.productId.toString() !== productId,
  );

  await cart.save();

  return cart;
};

export const clearCart = async (userId: string) => {
  const cart = await findCartByUser(userId);

  cart.cartItems = [];

  await cart.save();

  return cart;
};

export const getCartSummary = async (userId: string) => {
  const cart = await Cart.findOne({ userId }).populate(
    "cartItems.productId",
    "name price isActive",
  );

  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  const subtotal = cart.cartItems.reduce((total, item) => {
    const product = item.productId as any;

    if (!product?.isActive) {
      return total;
    }

    return total + product.price * item.quantity;
  }, 0);

  const totalItems = cart.cartItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  return {
    cart,
    totalItems,
    subtotal,
  };
};

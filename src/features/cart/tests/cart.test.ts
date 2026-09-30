import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import app from "../../../app";
import { Cart } from "../../../models/carts/models/cart.model";
import { Category } from "../../../models/categories/models/category.model";
import { Product } from "../../../models/products/models/product.model";

const createUserAndGetToken = async (
  email: string,
  phone: string,
) => {
  await request(app).post("/auth/register").send({
    email,
    password: "password123",
    firstName: "Test",
    lastName: "User",
    phone,
  });

  const loginResponse = await request(app)
    .post("/auth/login")
    .send({
      email,
      password: "password123",
    });

  return loginResponse.body.data.token;
};

const createCategory = async () => {
  return Category.create({
    name: `cat-${Math.random().toString(36).slice(2, 10)}`,
    description: "Category description for testing",
    isActive: true,
  });
};

const createProduct = async (
  categoryId: string,
  overrides = {},
) => {
  return Product.create({
    name: `product-${Date.now()}-${Math.random()}`,
    description: "Product description",
    brand: "TechBrand",
    price: 1000,
    stock: 10,
    isActive: true,
    categoryId,
    images: [
      {
        url: "https://test.com/image.jpg",
        alt: "Product",
        publicId: "test-image",
      },
    ],
    ...overrides,
  });
};

describe("Cart API", () => {
  beforeEach(async () => {
    await Cart.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
  });

  it("should add product to cart", async () => {
    const token = await createUserAndGetToken(
      "cart1@example.com",
      "+201000000001",
    );

    const category = await createCategory();

    const product = await createProduct(
      category._id.toString(),
    );

    const response = await request(app)
      .post(`/cart/${product._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        quantity: 1,
      });

    expect(response.status).toBe(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.cartItems).toHaveLength(1);
  });

  it("should reject non-existing product", async () => {
    const token = await createUserAndGetToken(
      "cart2@example.com",
      "+201000000002",
    );

    const response = await request(app)
      .post("/cart/507f1f77bcf86cd799439011")
      .set("Authorization", `Bearer ${token}`)
      .send({
        quantity: 1,
      });

    expect(response.status).toBe(404);

    expect(response.body).toMatchObject({
      success: false,
      message: "Product not found",
    });
  });

  it("should reject inactive product", async () => {
    const token = await createUserAndGetToken(
      "cart3@example.com",
      "+201000000003",
    );

    const category = await createCategory();

    const product = await createProduct(
      category._id.toString(),
      {
        isActive: false,
      },
    );

    const response = await request(app)
      .post(`/cart/${product._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        quantity: 1,
      });

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      message: "Product is unavailable",
    });
  });

  it("should reject invalid quantity", async () => {
    const token = await createUserAndGetToken(
      "cart4@example.com",
      "+201000000004",
    );

    const category = await createCategory();

    const product = await createProduct(
      category._id.toString(),
    );

    const response = await request(app)
      .post(`/cart/${product._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        quantity: 0,
      });

    expect(response.status).toBe(400);
  });

  it("should get cart", async () => {
    const token = await createUserAndGetToken(
      "cart5@example.com",
      "+201000000005",
    );

    const category = await createCategory();

    const product = await createProduct(
      category._id.toString(),
    );

    await request(app)
      .post(`/cart/${product._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        quantity: 2,
      });

    const response = await request(app)
      .get("/cart")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("should return 404 when cart does not exist", async () => {
    const token = await createUserAndGetToken(
      "cart6@example.com",
      "+201000000006",
    );

    const response = await request(app)
      .get("/cart")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);

    expect(response.body).toMatchObject({
      success: false,
      message: "Cart not found",
    });
  });

  it("should update cart item quantity", async () => {
    const token = await createUserAndGetToken(
      "cart7@example.com",
      "+201000000007",
    );

    const category = await createCategory();

    const product = await createProduct(
      category._id.toString(),
    );

    await request(app)
      .post(`/cart/${product._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        quantity: 1,
      });

    const response = await request(app)
      .patch(`/cart/${product._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        quantity: 5,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("should reject update for product not in cart", async () => {
    const token = await createUserAndGetToken(
      "cart8@example.com",
      "+201000000008",
    );

    const response = await request(app)
      .patch("/cart/507f1f77bcf86cd799439011")
      .set("Authorization", `Bearer ${token}`)
      .send({
        quantity: 5,
      });

    expect(response.status).toBe(404);

    expect(response.body).toMatchObject({
      success: false,
      message: "Cart not found",
    });
  });

  it("should delete item from cart", async () => {
    const token = await createUserAndGetToken(
      "cart9@example.com",
      "+201000000009",
    );

    const category = await createCategory();

    const product = await createProduct(
      category._id.toString(),
    );

    await request(app)
      .post(`/cart/${product._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        quantity: 1,
      });

    const response = await request(app)
      .delete(`/cart/${product._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("should clear cart", async () => {
    const token = await createUserAndGetToken(
      "cart10@example.com",
      "+201000000010",
    );

    const category = await createCategory();

    const product = await createProduct(
      category._id.toString(),
    );

    await request(app)
      .post(`/cart/${product._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        quantity: 2,
      });

    const response = await request(app)
      .delete("/cart")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      success: true,
      message: "Cart cleared successfully",
    });
  });

  it("should get cart summary", async () => {
    const token = await createUserAndGetToken(
      "cart11@example.com",
      "+201000000011",
    );

    const category = await createCategory();

    const product = await createProduct(
      category._id.toString(),
      {
        price: 500,
      },
    );

    await request(app)
      .post(`/cart/${product._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        quantity: 2,
      });

    const response = await request(app)
      .get("/cart/summary")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("cart");
    expect(response.body.data).toHaveProperty("subtotal");
    expect(response.body.data).toHaveProperty("totalItems");
    expect(response.body.data.subtotal).toBe(1000);
    expect(response.body.data.totalItems).toBe(2);
  });

  it("should increase quantity when product already exists", async () => {
    const token = await createUserAndGetToken(
      "cart12@example.com",
      "+201000000012",
    );

    const category = await createCategory();

    const product = await createProduct(
      category._id.toString(),
    );

    await request(app)
      .post(`/cart/${product._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        quantity: 1,
      });

    const response = await request(app)
      .post(`/cart/${product._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        quantity: 2,
      });

    expect(response.status).toBe(201);

    expect(
      response.body.data.cartItems[0].quantity,
    ).toBe(3);
  });

  it("should reject unauthorized requests", async () => {
    const response = await request(app)
      .get("/cart");

    expect(response.status).toBe(401);
  });
});
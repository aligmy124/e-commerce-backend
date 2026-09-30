import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../app";
import { Category } from "../../../models/categories/models/category.model";
import { Product } from "../../../models/products/models/product.model";
import { User } from "../../../models/users/models/user.model";
import { Cart } from "../../../models/carts/models/cart.model";
import { OrderItem } from "../../../models/orders/models/order-item.model";
import { Order } from "../../../models/orders/models/order.model";

describe("create order", () => {
  it("should return 401 if user is not authenticated", async () => {
    const order = await request(app)
      .post("/orders")
      .send({
        shippingAddress: {
          fullName: "Ali Mohamed",
          phone: "+201234567890",
          country: "Egypt",
          city: "Minya",
          street: "El Edwah Street 12",
          postalCode: "61511",
        },
      });
    expect(order.status).toBe(401);
    expect(order.body).toMatchObject({
      success: false,
      message: "Unauthorized",
    });
  });
  it("should return 400 if shipping address is invalid", async () => {
    await request(app).post("/auth/register").send({
      email: "userA@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "User",
      phone: "+201000000001",
    });
    const loginResponse = await request(app).post("/auth/login").send({
      email: "userA@example.com",
      password: "password123",
    });
    const token = loginResponse.body.data.token;

    const order = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        shippingAddress: {
          phone: "+201234567890",
          country: "E",
          city: "Minya",
          street: "El Edwah Street 12",
          postalCode: "61511",
        },
      });

    expect(order.body.success).toBe(false);
    expect(order.body.message).toBe("Invalid data");
    expect(order.body.errors).toContainEqual({
      path: "shippingAddress.fullName",
      message: "Full name is required",
    });
    expect(order.body.errors).toContainEqual({
      path: "shippingAddress.country",
      message: "Country must be at least 2 characters",
    });
  });
  it("should create an order successfully", async () => {
    await request(app).post("/auth/register").send({
      email: "userA@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "User",
      phone: "+201000000001",
    });
    const loginResponse = await request(app).post("/auth/login").send({
      email: "userA@example.com",
      password: "password123",
    });
    const token = loginResponse.body.data.token;

    const category = await Category.create({
      name: "laptops",
      description: "Laptops are popular devices",
      isActive: true,
    });

    const product = await Product.create({
      name: "Laptop X200",
      description: "High performance laptop",
      brand: "TechBrand",
      price: 1200,
      stock: 50,
      isActive: true,
      categoryId: category._id,
      images: [
        { url: "https://test.com/test.jpg", alt: "Laptop", publicId: "test" },
      ],
    });

    await request(app)
      .post(`/cart/${product._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 1 });

    const order = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        shippingAddress: {
          fullName: "Ali Mohamed",
          phone: "+201234567890",
          country: "Egypt",
          city: "Minya",
          street: "El Edwah Street 12",
          postalCode: "61511",
        },
      });

    expect(order.status).toBe(201);
    expect(order.body).toMatchObject({
      success: true,
      message: "Order has been placed successfully",
    });

    const createdOrder = await Order.findById(order.body.orderId);
    expect(createdOrder?.totalPrice).toBe(1200);

    const orderItem = await OrderItem.findOne({
      orderId: order.body.orderId,
    });
    expect(orderItem).toMatchObject({
      productId: product._id,
      quantity: 1,
      price: 1200,
    });

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct?.stock).toBe(49);

    const user = await User.findOne({ email: "userA@example.com" });
    const cart = await Cart.findOne({ userId: user?._id });
    expect(cart?.cartItems).toHaveLength(0);
  });
  it("should return 400 if cart is empty", async () => {
    await request(app).post("/auth/register").send({
      email: "userA@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "User",
      phone: "+201000000001",
    });
    const loginResponse = await request(app).post("/auth/login").send({
      email: "userA@example.com",
      password: "password123",
    });
    const token = loginResponse.body.data.token;

    const user = await User.findOne({ email: "userA@example.com" });
    await Cart.create({ userId: user?._id, cartItems: [] });

    const order = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        shippingAddress: {
          fullName: "Ali Mohamed",
          phone: "+201234567890",
          country: "Egypt",
          city: "Minya",
          street: "El Edwah Street 12",
          postalCode: "61511",
        },
      });

    expect(order.status).toBe(400);
    expect(order.body.message).toBe("Cart is empty");
  });
  it("should return 404 if product is inactive", async () => {
    await request(app).post("/auth/register").send({
      email: "userA@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "User",
      phone: "+201000000001",
    });
    const loginResponse = await request(app).post("/auth/login").send({
      email: "userA@example.com",
      password: "password123",
    });
    const token = loginResponse.body.data.token;
    const category = await Category.create({
      name: "phones",
      description: "Phones category",
      isActive: true,
    });

    const product = await Product.create({
      name: "Laptop X200",
      description: "High performance laptop",
      brand: "TechBrand",
      price: 500,
      stock: 10,
      isActive: false,
      categoryId: category._id,
      images: [
        { url: "https://test.com/test.jpg", alt: "Laptop", publicId: "test" },
      ],
    });

    await Cart.create({
      userId: loginResponse.body.data.id,
      cartItems: [
        {
          productId: product._id,
          quantity: 1,
        },
      ],
    });

    const order = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        shippingAddress: {
          fullName: "Ali Mohamed",
          phone: "+201234567890",
          country: "Egypt",
          city: "Minya",
          street: "El Edwah Street 12",
          postalCode: "61511",
        },
      });

    expect(order.status).toBe(404);
    expect(order.body.message).toBe(`Product ${product._id} is not available`);
  });
  it("should return 400 if product stock is insufficient", async () => {
    await request(app).post("/auth/register").send({
      email: "userA@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "User",
      phone: "+201000000001",
    });
    const loginResponse = await request(app).post("/auth/login").send({
      email: "userA@example.com",
      password: "password123",
    });
    const token = loginResponse.body.data.token;

    const category = await Category.create({
      name: "tablets",
      description: "Tablets category",
      isActive: true,
    });

    const product = await Product.create({
      name: "Laptop X200",
      description: "High performance laptop",
      brand: "TechBrand",
      price: 800,
      stock: 1,
      isActive: true,
      categoryId: category._id,
      images: [
        { url: "https://test.com/test.jpg", alt: "Laptop", publicId: "test" },
      ],
    });

    await request(app)
      .post(`/cart/${product._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 2 });

    const order = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        shippingAddress: {
          fullName: "Ali Mohamed",
          phone: "+201234567890",
          country: "Egypt",
          city: "Minya",
          street: "El Edwah Street 12",
          postalCode: "61511",
        },
      });

    expect(order.status).toBe(400);

    expect(order.body.message).toContain("Insufficient stock");
  });
});

import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../app";
import { User } from "../../../models/users/models/user.model";
import { Order } from "../../../models/orders/models/order.model";
import { Product } from "../../../models/products/models/product.model";
import { Cart } from "../../../models/carts/models/cart.model";
import { Category } from "../../../models/categories/models/category.model";
import { OrderItem } from "../../../models/orders/models/order-item.model";
import { createTestAdmin } from "../../../test/helpers/createTestAdmin";

describe("Get Order", () => {
  it("gets user's orders", async () => {
    const registerResponse = await request(app).post("/auth/register").send({
      email: "my-orders@example.com",
      password: "password123",
      firstName: "Orders",
      lastName: "User",
      phone: "+201000000002",
    });

    expect(registerResponse.status).toBe(201);

    const loginResponse = await request(app).post("/auth/login").send({
      email: "my-orders@example.com",
      password: "password123",
    });

    const token = loginResponse.body.data.token;
    const userId = loginResponse.body.data.id;

    await Order.create({
      userId,
      status: "pending",
      totalPrice: 1000,
      shippingAddress: {
        fullName: "Orders User",
        phone: "+201000000002",
        country: "Egypt",
        city: "Minya",
        street: "Main Street",
        postalCode: "61511",
      },
    });

    const response = await request(app)
      .get("/orders/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.orders).toBeInstanceOf(Array);
  });
  it("creates an order successfully", async () => {
    // register
    const registerResponse = await request(app).post("/auth/register").send({
      email: "order-create@example.com",
      password: "password123",
      firstName: "Order",
      lastName: "Test",
      phone: "+201000000001",
    });

    expect(registerResponse.status).toBe(201);

    // login
    const loginResponse = await request(app).post("/auth/login").send({
      email: "order-create@example.com",
      password: "password123",
    });

    expect(loginResponse.status).toBe(201);

    const token = loginResponse.body.data.token;
    const userId = loginResponse.body.data.id;

    // category
    const category = await Category.create({
      name: "OrderTest",
      description: "Test category",
      isActive: true,
    });

    // product
    const product = await Product.create({
      name: "Test Laptop",
      description: "Test product",
      brand: "TestBrand",
      price: 1000,
      stock: 10,
      isActive: true,
      categoryId: category._id,
      images: [
        {
          url: "https://test.com/test.jpg",
          alt: "Test Laptop",
          publicId: "test",
        },
      ],
    });

    // cart
    await Cart.create({
      userId,
      cartItems: [
        {
          productId: product._id,
          quantity: 2,
        },
      ],
    });

    // create order
    const response = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({
        shippingAddress: {
          fullName: "Order Test",
          phone: "+201000000001",
          country: "Egypt",
          city: "Minya",
          street: "Main Street",
          postalCode: "61511",
        },
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.orderId).toBeDefined();

    const order = await Order.findById(response.body.orderId);

    expect(order).not.toBeNull();
    expect(order?.status).toBe("pending");
    expect(order?.totalPrice).toBe(2000);

    // stock should decrease
    const updatedProduct = await Product.findById(product._id);

    expect(updatedProduct?.stock).toBe(8);

    // cart should be empty
    const cart = await Cart.findOne({ userId });

    expect(cart?.cartItems).toHaveLength(0);
  });
  it("gets a specific order belonging to the user", async () => {
    const registerResponse = await request(app).post("/auth/register").send({
      email: "single-order@example.com",
      password: "password123",
      firstName: "Single",
      lastName: "Order",
      phone: "+201000000003",
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email: "single-order@example.com",
      password: "password123",
    });

    const token = loginResponse.body.data.token;
    const userId = loginResponse.body.data.id;

    const category = await Category.create({
      name: "SingleOrder",
      description: "Test",
      isActive: true,
    });

    const product = await Product.create({
      name: "Single Laptop",
      description: "Test",
      brand: "Test",
      price: 500,
      stock: 10,
      isActive: true,
      categoryId: category._id,
      images: [
        {
          url: "https://test.com/test.jpg",
          alt: "Laptop",
          publicId: "single",
        },
      ],
    });

    const order = await Order.create({
      userId,
      status: "pending",
      totalPrice: 500,
      shippingAddress: {
        fullName: "Single Order",
        phone: "+201000000003",
        country: "Egypt",
        city: "Minya",
        street: "Street",
        postalCode: "61511",
      },
    });

    await OrderItem.create({
      orderId: order._id,
      productId: product._id,
      quantity: 1,
      price: 500,
    });

    const response = await request(app)
      .get(`/orders/me/${order._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.totalPrice).toBe(500);
    expect(response.body.data.items).toHaveLength(1);
  });
  it("cancels a pending order and restores stock", async () => {
    const registerResponse = await request(app).post("/auth/register").send({
      email: "cancel-order@example.com",
      password: "password123",
      firstName: "Cancel",
      lastName: "Test",
      phone: "+201000000004",
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email: "cancel-order@example.com",
      password: "password123",
    });

    const token = loginResponse.body.data.token;
    const userId = loginResponse.body.data.id;

    const category = await Category.create({
      name: "CancelOrder",
      description: "Test",
      isActive: true,
    });

    const product = await Product.create({
      name: "Cancel Laptop",
      description: "Test",
      brand: "Test",
      price: 1000,
      stock: 8,
      isActive: true,
      categoryId: category._id,
      images: [
        {
          url: "https://test.com/test.jpg",
          alt: "Laptop",
          publicId: "cancel",
        },
      ],
    });

    const order = await Order.create({
      userId,
      status: "pending",
      totalPrice: 2000,
      shippingAddress: {
        fullName: "Cancel Test",
        phone: "+201000000004",
        country: "Egypt",
        city: "Minya",
        street: "Street",
        postalCode: "61511",
      },
    });

    await OrderItem.create({
      orderId: order._id,
      productId: product._id,
      quantity: 2,
      price: 1000,
    });

    const response = await request(app)
      .patch(`/orders/cancel/${order._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const cancelledOrder = await Order.findById(order._id);

    expect(cancelledOrder?.status).toBe("cancelled");

    const updatedProduct = await Product.findById(product._id);

    expect(updatedProduct?.stock).toBe(10);
  });
  it("admin can get all orders", async () => {
    // =========================
    // CREATE ADMIN
    // =========================

    const admin = await createTestAdmin();

    // =========================
    // LOGIN ADMIN
    // =========================

    const loginResponse = await request(app).post("/auth/login").send({
      email: admin.user.email,
      password: admin.password,
    });

    expect(loginResponse.status).toBe(201);

    const token = loginResponse.body.data.token;

    // =========================
    // CREATE ORDERS
    // =========================

    await Order.create([
      {
        userId: admin.user._id,
        status: "pending",
        totalPrice: 1000,
        shippingAddress: {
          fullName: "Test User",
          phone: "+201000000001",
          country: "Egypt",
          city: "Minya",
          street: "Main Street",
          postalCode: "61511",
        },
      },
      {
        userId: admin.user._id,
        status: "paid",
        totalPrice: 2000,
        shippingAddress: {
          fullName: "Test User",
          phone: "+201000000001",
          country: "Egypt",
          city: "Minya",
          street: "Main Street",
          postalCode: "61511",
        },
      },
    ]);

    // =========================
    // GET ALL ORDERS
    // =========================

    const response = await request(app)
      .get("/orders")
      .set("Authorization", `Bearer ${token}`);

    console.log("STATUS:", response.status);
    console.log("BODY:", response.body);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body.data).toBeDefined();
    expect(response.body.data.orders).toBeInstanceOf(Array);

    expect(response.body.data.pagination).toBeDefined();
    expect(response.body.data.pagination.page).toBe(1);
    expect(response.body.data.pagination.limit).toBe(10);
  });
  it("admin can paginate orders", async () => {
    const admin = await createTestAdmin();

    const loginResponse = await request(app).post("/auth/login").send({
      email: admin.user.email,
      password: admin.password,
    });

    const token = loginResponse.body.data.token;

    const category = await Category.create({
      name: "AdminOrders",
      description: "Test category",
      isActive: true,
    });

    const product = await Product.create({
      name: "Admin Product",
      description: "Test product",
      brand: "TestBrand",
      price: 500,
      stock: 50,
      isActive: true,
      categoryId: category._id,
      images: [
        {
          url: "https://test.com/test.jpg",
          alt: "Product",
          publicId: "admin-test",
        },
      ],
    });

    for (let i = 0; i < 5; i++) {
      const order = await Order.create({
        userId: admin.user._id,
        status: "pending",
        totalPrice: 500,
        shippingAddress: {
          fullName: "Test User",
          phone: "+201000000001",
          country: "Egypt",
          city: "Minya",
          street: "Main Street",
          postalCode: "61511",
        },
      });

      await OrderItem.create({
        orderId: order._id,
        productId: product._id,
        quantity: 1,
        price: 500,
      });
    }

    const response = await request(app)
      .get("/orders?page=1&limit=2")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const { orders, pagination } = response.body.data;

    expect(orders).toHaveLength(2);

    expect(pagination.page).toBe(1);
    expect(pagination.limit).toBe(2);
    expect(pagination.total).toBe(5);
    expect(pagination.totalPages).toBe(3);
  });
  it("admin can filter orders by status", async () => {
    const admin = await createTestAdmin();

    const loginResponse = await request(app).post("/auth/login").send({
      email: admin.user.email,
      password: admin.password,
    });

    const token = loginResponse.body.data.token;

    const category = await Category.create({
      name: "StatusTest",
      description: "Test",
      isActive: true,
    });

    const product = await Product.create({
      name: "Status Product",
      description: "Test",
      brand: "Test",
      price: 500,
      stock: 20,
      isActive: true,
      categoryId: category._id,
      images: [
        {
          url: "https://test.com/test.jpg",
          alt: "Product",
          publicId: "status-test",
        },
      ],
    });

    const paidOrder = await Order.create({
      userId: admin.user._id,
      status: "paid",
      totalPrice: 500,
      shippingAddress: {
        fullName: "Test User",
        phone: "+201000000001",
        country: "Egypt",
        city: "Minya",
        street: "Street",
        postalCode: "61511",
      },
    });

    const pendingOrder = await Order.create({
      userId: admin.user._id,
      status: "pending",
      totalPrice: 500,
      shippingAddress: {
        fullName: "Test User",
        phone: "+201000000001",
        country: "Egypt",
        city: "Minya",
        street: "Street",
        postalCode: "61511",
      },
    });

    await OrderItem.create({
      orderId: paidOrder._id,
      productId: product._id,
      quantity: 1,
      price: 500,
    });

    await OrderItem.create({
      orderId: pendingOrder._id,
      productId: product._id,
      quantity: 1,
      price: 500,
    });

    const response = await request(app)
      .get("/orders?status=paid")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const orders = response.body.data.orders;

    expect(orders.length).toBeGreaterThan(0);

    for (const order of orders) {
      expect(order.status).toBe("paid");
    }
  });
  it("admin can cancel a pending order", async () => {
    const admin = await createTestAdmin();

    const loginResponse = await request(app).post("/auth/login").send({
      email: admin.user.email,
      password: admin.password,
    });

    const token = loginResponse.body.data.token;

    const category = await Category.create({
      name: "UpdateStatus",
      description: "Test",
      isActive: true,
    });

    const product = await Product.create({
      name: "Status Laptop",
      description: "Test",
      brand: "Test",
      price: 1000,
      stock: 8,
      isActive: true,
      categoryId: category._id,
      images: [
        {
          url: "https://test.com/test.jpg",
          alt: "Laptop",
          publicId: "update-status",
        },
      ],
    });

    const order = await Order.create({
      userId: admin.user._id,
      status: "pending",
      totalPrice: 2000,
      shippingAddress: {
        fullName: "Test User",
        phone: "+201000000001",
        country: "Egypt",
        city: "Minya",
        street: "Street",
        postalCode: "61511",
      },
    });

    await OrderItem.create({
      orderId: order._id,
      productId: product._id,
      quantity: 2,
      price: 1000,
    });

    const response = await request(app)
      .patch(`/orders/${order._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        status: "cancelled",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const updatedOrder = await Order.findById(order._id);

    expect(updatedOrder?.status).toBe("cancelled");

    const updatedProduct = await Product.findById(product._id);

    expect(updatedProduct?.stock).toBe(10);
  });
});

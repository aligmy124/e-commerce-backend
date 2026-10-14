import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";

import app from "../../../app";
import { stripe } from "../../../config/stripe";
import { env } from "../../../config/env";

import { Category } from "../../../models/categories/models/category.model";
import { Product } from "../../../models/products/models/product.model";
import { Order } from "../../../models/orders/models/order.model";
import { OrderItem } from "../../../models/orders/models/order-item.model";
import { Payment } from "../../../models/payment/models/payment.models";

describe("Payment Integration", () => {
  let token: string;
  let userId: string;
  let product: any;
  let order: any;

  beforeEach(async () => {
    //
    // 1. CREATE USER
    //

    const email = `payment-${Date.now()}@example.com`;

    await request(app).post("/auth/register").send({
      email,
      password: "password123",
      firstName: "Payment",
      lastName: "Test",
      phone: "+201000000001",
    });

    //
    // 2. LOGIN
    //

    const loginResponse = await request(app).post("/auth/login").send({
      email,
      password: "password123",
    });

    expect(loginResponse.status).toBe(201);

    token = loginResponse.body.data.token;
    userId = loginResponse.body.data.id;

    //
    // 3. CATEGORY
    //

    const category = await Category.create({
      name: "Laptops",
      description: "Laptop products",
      isActive: true,
    });

    //
    // 4. PRODUCT
    //

    product = await Product.create({
      name: "Payment Test Laptop",
      description: "Laptop for payment tests",
      brand: "TestBrand",
      price: 1200,
      stock: 50,
      isActive: true,
      categoryId: category._id,
      images: [
        {
          url: "https://test.com/image.jpg",
          alt: "Payment Laptop",
          publicId: "payment-image",
        },
      ],
    });

    //
    // 5. ORDER
    //

    order = await Order.create({
      userId,
      status: "pending",
      totalPrice: 2400,
      shippingAddress: {
        fullName: "Payment Test",
        phone: "+201000000001",
        country: "Egypt",
        city: "Minya",
        street: "Main Street",
        postalCode: "61511",
      },
    });

    //
    // 6. ORDER ITEM
    //

    await OrderItem.create({
      orderId: order._id,
      productId: product._id,
      quantity: 2,
      price: 1200,
    });
  });

  // TEST 1
  // CREATE CHECKOUT

  it("creates checkout session and pending payment", async () => {
    const response = await request(app)
      .post(`/payment/${order._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.data.checkoutURL).toBeDefined();

    const payment = await Payment.findOne({
      orderId: order._id,
    });

    expect(payment).not.toBeNull();

    expect(payment?.status).toBe("pending");

    expect(payment?.amount).toBe(2400);

    expect(payment?.method).toBe("credit_card");
  });

  // TEST 2
  // SUCCESSFUL PAYMENT

  it("marks order and payment as paid after checkout completed", async () => {
    // First create checkout/payment

    await request(app)
      .post(`/payment/${order._id}`)
      .set("Authorization", `Bearer ${token}`);

    const payload = JSON.stringify({
      id: "evt_success_test",
      object: "event",
      type: "checkout.session.completed",

      data: {
        object: {
          id: "cs_success_test",

          object: "checkout.session",

          payment_intent: "pi_success_test",

          metadata: {
            orderId: order._id.toString(),
            userId,
          },

          mode: "payment",
          payment_status: "paid",
        },
      },
    });

    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: env.STRIPE_WEBHOOK_SECRET!,
    });

    const response = await request(app)
      .post("/payment/webhook")
      .set("stripe-signature", signature)
      .set("Content-Type", "application/json")
      .send(payload);

    expect(response.status).toBe(200);

    const updatedOrder = await Order.findById(order._id);

    expect(updatedOrder?.status).toBe("paid");

    const payment = await Payment.findOne({
      orderId: order._id,
    });

    expect(payment?.status).toBe("paid");

    expect(payment?.transactionId).toBe("pi_success_test");

    expect(payment?.paidAt).toBeDefined();
  });

  // TEST 3
  // DUPLICATE SUCCESS WEBHOOK

  it("does not create or modify payment twice when success webhook is duplicated", async () => {
    await request(app)
      .post(`/payment/${order._id}`)
      .set("Authorization", `Bearer ${token}`);

    const payload = JSON.stringify({
      id: "evt_duplicate_test",
      object: "event",
      type: "checkout.session.completed",

      data: {
        object: {
          id: "cs_duplicate_test",

          object: "checkout.session",

          payment_intent: "pi_duplicate_test",

          metadata: {
            orderId: order._id.toString(),
            userId,
          },

          mode: "payment",
          payment_status: "paid",
        },
      },
    });

    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: env.STRIPE_WEBHOOK_SECRET!,
    });

    // First webhook

    const firstResponse = await request(app)
      .post("/payment/webhook")
      .set("stripe-signature", signature)
      .set("Content-Type", "application/json")
      .send(payload);

    expect(firstResponse.status).toBe(200);

    // Second webhook

    const secondResponse = await request(app)
      .post("/payment/webhook")
      .set("stripe-signature", signature)
      .set("Content-Type", "application/json")
      .send(payload);

    expect(secondResponse.status).toBe(200);

    const payments = await Payment.find({
      orderId: order._id,
    });

    expect(payments).toHaveLength(1);

    expect(payments[0].status).toBe("paid");

    expect(payments[0].transactionId).toBe("pi_duplicate_test");
  });

  // TEST 4
  // PAYMENT FAILED

  it("marks payment as failed when payment_intent.payment_failed is received", async () => {
    await request(app)
      .post(`/payment/${order._id}`)
      .set("Authorization", `Bearer ${token}`);

    const payload = JSON.stringify({
      id: "evt_failed_test",
      object: "event",
      type: "payment_intent.payment_failed",

      data: {
        object: {
          id: "pi_failed_test",

          object: "payment_intent",

          metadata: {
            orderId: order._id.toString(),
            userId,
          },

          status: "requires_payment_method",
        },
      },
    });

    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: env.STRIPE_WEBHOOK_SECRET!,
    });

    const response = await request(app)
      .post("/payment/webhook")
      .set("stripe-signature", signature)
      .set("Content-Type", "application/json")
      .send(payload);

    expect(response.status).toBe(200);

    const payment = await Payment.findOne({
      orderId: order._id,
    });

    expect(payment?.status).toBe("failed");

    expect(payment?.transactionId).toBe("pi_failed_test");

    const updatedOrder = await Order.findById(order._id);

    expect(updatedOrder?.status).toBe("pending");
  });

  // TEST 5
  // ASYNC PAYMENT FAILED

  it("marks payment as failed when async payment fails", async () => {
    await request(app)
      .post(`/payment/${order._id}`)
      .set("Authorization", `Bearer ${token}`);

    const payload = JSON.stringify({
      id: "evt_async_failed_test",
      object: "event",
      type: "checkout.session.async_payment_failed",

      data: {
        object: {
          id: "cs_async_failed_test",

          object: "checkout.session",

          payment_intent: "pi_async_failed_test",

          metadata: {
            orderId: order._id.toString(),
            userId,
          },
        },
      },
    });

    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: env.STRIPE_WEBHOOK_SECRET!,
    });

    const response = await request(app)
      .post("/payment/webhook")
      .set("stripe-signature", signature)
      .set("Content-Type", "application/json")
      .send(payload);

    expect(response.status).toBe(200);

    const payment = await Payment.findOne({
      orderId: order._id,
    });

    expect(payment?.status).toBe("failed");
  });

  // TEST 6
  // REFUND

  it("starts refund for a paid order", async () => {
    // Create checkout

    await request(app)
      .post(`/payment/${order._id}`)
      .set("Authorization", `Bearer ${token}`);

    // Mark payment as paid directly
    // because this test is about refund API

    const payment = await Payment.findOne({
      orderId: order._id,
    });

    payment!.status = "paid";
    payment!.transactionId = "pi_refund_test";

    await payment!.save();

    const paidOrder = await Order.findById(order._id);

    paidOrder!.status = "paid";

    await paidOrder!.save();

    // Mock Stripe refund

    const refundSpy = vi.spyOn(stripe.refunds, "create").mockResolvedValue({
      id: "re_test_123",
      object: "refund",
      amount: 2400,
      currency: "usd",
      payment_intent: "pi_refund_test",
      status: "pending",
    } as any);

    const response = await request(app)
      .post(`/payment/${order._id}/refund`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data.refundId).toBe("re_test_123");

    expect(refundSpy).toHaveBeenCalledOnce();

    const updatedPayment = await Payment.findOne({
      orderId: order._id,
    });

    expect(updatedPayment?.status).toBe("refund_processing");

    refundSpy.mockRestore();
  });

  // TEST 7
  // REFUND COMPLETED

  it("marks payment and order as refunded after refund webhook", async () => {
    await request(app)
      .post(`/payment/${order._id}`)
      .set("Authorization", `Bearer ${token}`);

    const payment = await Payment.findOne({
      orderId: order._id,
    });

    payment!.status = "refund_processing";
    payment!.transactionId = "pi_refund_completed_test";

    await payment!.save();

    const paidOrder = await Order.findById(order._id);

    paidOrder!.status = "paid";

    await paidOrder!.save();

    const payload = JSON.stringify({
      id: "evt_refund_completed_test",
      object: "event",
      type: "refund.updated",

      data: {
        object: {
          id: "re_refund_completed_test",

          object: "refund",

          status: "succeeded",

          payment_intent: "pi_refund_completed_test",
        },
      },
    });

    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: env.STRIPE_WEBHOOK_SECRET!,
    });

    const response = await request(app)
      .post("/payment/webhook")
      .set("stripe-signature", signature)
      .set("Content-Type", "application/json")
      .send(payload);

    expect(response.status).toBe(200);

    const updatedPayment = await Payment.findOne({
      orderId: order._id,
    });

    expect(updatedPayment?.status).toBe("refunded");

    const updatedOrder = await Order.findById(order._id);

    expect(updatedOrder?.status).toBe("refunded");
  });

  // TEST 8
  // DUPLICATE REFUND WEBHOOK

  it("does not restore stock twice when refund webhook is duplicated", async () => {
    await request(app)
      .post(`/payment/${order._id}`)
      .set("Authorization", `Bearer ${token}`);

    const payment = await Payment.findOne({
      orderId: order._id,
    });

    payment!.status = "refund_processing";
    payment!.transactionId = "pi_duplicate_refund";

    await payment!.save();

    const paidOrder = await Order.findById(order._id);

    paidOrder!.status = "paid";

    await paidOrder!.save();

    const initialStock = product.stock;

    const payload = JSON.stringify({
      id: "evt_duplicate_refund",
      object: "event",
      type: "refund.updated",

      data: {
        object: {
          id: "re_duplicate_refund",

          object: "refund",

          status: "succeeded",

          payment_intent: "pi_duplicate_refund",
        },
      },
    });

    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: env.STRIPE_WEBHOOK_SECRET!,
    });

    // First refund webhook

    const firstResponse = await request(app)
      .post("/payment/webhook")
      .set("stripe-signature", signature)
      .set("Content-Type", "application/json")
      .send(payload);

    expect(firstResponse.status).toBe(200);

    // Second refund webhook

    const secondResponse = await request(app)
      .post("/payment/webhook")
      .set("stripe-signature", signature)
      .set("Content-Type", "application/json")
      .send(payload);

    expect(secondResponse.status).toBe(200);

    const updatedProduct = await Product.findById(product._id);

    // Stock restored only once
    expect(updatedProduct?.stock).toBe(initialStock + 2);

    const updatedPayment = await Payment.findOne({
      orderId: order._id,
    });

    expect(updatedPayment?.status).toBe("refunded");
  });

  // TEST 9
  // DUPLICATE CHECKOUT

  it("should reject creating checkout twice for the same order", async () => {
    // First checkout
    const firstResponse = await request(app)
      .post(`/payment/${order._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(firstResponse.status).toBe(201);

    expect(firstResponse.body.success).toBe(true);

    expect(firstResponse.body.data.checkoutURL).toBeDefined();

    // Second checkout
    const secondResponse = await request(app)
      .post(`/payment/${order._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(secondResponse.status).toBe(400);

    expect(secondResponse.body).toMatchObject({
      success: false,
      message: "Checkout already created for this order",
    });

    // Make sure only ONE payment was created
    const payments = await Payment.find({
      orderId: order._id,
    });

    expect(payments).toHaveLength(1);

    expect(payments[0].status).toBe("pending");

    expect(payments[0].amount).toBe(2400);
  });

  // TEST 10
  // REFUND FAILURE

  it("should restore payment to paid if Stripe refund fails", async () => {
    // Create checkout
    await request(app)
      .post(`/payment/${order._id}`)
      .set("Authorization", `Bearer ${token}`);

    // Prepare paid payment
    const payment = await Payment.findOne({
      orderId: order._id,
    });

    payment!.status = "paid";
    payment!.transactionId = "pi_refund_failure_test";

    await payment!.save();

    // Prepare paid order
    const paidOrder = await Order.findById(order._id);

    paidOrder!.status = "paid";

    await paidOrder!.save();

    // Mock Stripe failure
    const refundSpy = vi
      .spyOn(stripe.refunds, "create")
      .mockRejectedValue(new Error("Stripe refund failed"));

    // Act
    const response = await request(app)
      .post(`/payment/${order._id}/refund`)
      .set("Authorization", `Bearer ${token}`);

    // Assert API error
    expect(response.status).toBe(500);

    expect(response.body).toMatchObject({
      success: false,
      message: "Internal server error",
    });

    // Stripe was called
    expect(refundSpy).toHaveBeenCalledOnce();

    // Payment should return to paid
    const updatedPayment = await Payment.findOne({
      orderId: order._id,
    });

    expect(updatedPayment?.status).toBe("paid");

    expect(updatedPayment?.transactionId).toBe("pi_refund_failure_test");

    refundSpy.mockRestore();
  });

  // TEST 11
// REFUND PENDING ORDER

it("should reject refund for a pending order", async () => {
  // Create checkout/payment
  await request(app)
    .post(`/payment/${order._id}`)
    .set("Authorization", `Bearer ${token}`);

  // Order is still pending
  const currentOrder = await Order.findById(order._id);

  expect(currentOrder?.status).toBe("pending");

  // Act
  const response = await request(app)
    .post(`/payment/${order._id}/refund`)
    .set("Authorization", `Bearer ${token}`);

  // Assert
  expect(response.status).toBe(404);

  expect(response.body).toMatchObject({
    success: false,
    message: "Order not found",
  });

  // Payment should remain pending
  const payment = await Payment.findOne({
    orderId: order._id,
  });

  expect(payment?.status).toBe("pending");
});
// TEST 12
// USER CANNOT REFUND ANOTHER USER'S ORDER

it("should reject refund for another user's order", async () => {
  // Create another user
  const anotherEmail = `another-payment-${Date.now()}@example.com`;

  await request(app).post("/auth/register").send({
    email: anotherEmail,
    password: "password123",
    firstName: "Another",
    lastName: "User",
    phone: "+201000000002",
  });

  // Login another user
  const anotherLogin = await request(app).post("/auth/login").send({
    email: anotherEmail,
    password: "password123",
  });

  expect(anotherLogin.status).toBe(201);

  const anotherToken = anotherLogin.body.data.token;

  // Prepare original user's order as paid
  const payment = await Payment.create({
    orderId: order._id,
    amount: order.totalPrice,
    method: "credit_card",
    status: "paid",
    transactionId: "pi_other_user_test",
  });

  order.status = "paid";
  await order.save();

  // Another user tries to refund this order
  const response = await request(app)
    .post(`/payment/${order._id}/refund`)
    .set("Authorization", `Bearer ${anotherToken}`);

  // Assert
  expect(response.status).toBe(404);

  expect(response.body).toMatchObject({
    success: false,
    message: "Order not found",
  });

  // Payment must remain unchanged
  const updatedPayment = await Payment.findById(payment._id);

  expect(updatedPayment?.status).toBe("paid");
});
});

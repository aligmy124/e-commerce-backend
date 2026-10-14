import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import app from "../../../app";
import { Category } from "../../../models/categories/models/category.model";
import { Product } from "../../../models/products/models/product.model";
import { Profile } from "../../../models/profiles/models/profile.model";
import { Review } from "../../../models/reviews/models/review.model";
import { createTestAdmin } from "../../../test/helpers/createTestAdmin";

const createTestProduct = async () => {
  const category = await Category.create({
    name: `cat-${Math.random().toString(36).slice(2, 10)}`,
    description: "Category description",
    isActive: true,
  });
  
  return Product.create({
    name: "Laptop X200",
    description: "High performance laptop",
    brand: "TechBrand",
    price: 1200,
    stock: 50,
    isActive: true,
    categoryId: category._id,
    images: [
      {
        url: "https://test.com/test-image.jpg",
        alt: "Laptop X200",
        publicId: "test-image",
      },
    ],
  });
};

const loginAdmin = async () => {
  const { user, password } = await createTestAdmin();

  const response = await request(app)
    .post("/auth/login")
    .send({
      email: user.email,
      password,
    });

  return {
    token: response.body.data.token,
    user,
  };
};

describe("Review API", () => {
  beforeEach(async () => {
    await Review.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
  });

  describe("POST /reviews/:productId", () => {
    it("should add review", async () => {
      const { token, user } = await loginAdmin();

      const product = await createTestProduct();

      const response = await request(app)
        .post(`/reviews/${product._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          rating: 4,
          comment: "Very nice product",
        });

      expect(response.status).toBe(201);

      expect(response.body).toMatchObject({
        success: true,
        message: "Review added successfully",
      });

      expect(response.body.data).toMatchObject({
        rating: 4,
        comment: "Very nice product",
        userId: user._id.toString(),
      });
    });

    it("should update product rating statistics", async () => {
      const { token } = await loginAdmin();

      const product = await createTestProduct();

      await request(app)
        .post(`/reviews/${product._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          rating: 5,
          comment: "Excellent",
        });

      const updatedProduct = await Product.findById(
        product._id,
      );

      expect(updatedProduct?.reviewsCount).toBe(1);
      expect(updatedProduct?.averageRating).toBe(5);
    });

    it("should reject duplicate review", async () => {
      const { token, user } = await loginAdmin();

      const product = await createTestProduct();

      await Review.create({
        userId: user._id,
        productId: product._id,
        rating: 5,
        comment: "First review",
      });

      const response = await request(app)
        .post(`/reviews/${product._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          rating: 4,
          comment: "Second review",
        });

      expect(response.status).toBe(409);

      expect(response.body).toMatchObject({
        success: false,
        message:
          "You have already reviewed this product",
      });
    });

    it("should reject unauthenticated user", async () => {
      const product = await createTestProduct();

      const response = await request(app)
        .post(`/reviews/${product._id}`)
        .send({
          rating: 5,
          comment: "Excellent",
        });

      expect(response.status).toBe(401);
    });

    it("should reject non-existing product", async () => {
      const { token } = await loginAdmin();

      const response = await request(app)
        .post(
          "/reviews/507f1f77bcf86cd799439011",
        )
        .set("Authorization", `Bearer ${token}`)
        .send({
          rating: 5,
          comment: "Excellent",
        });

      expect(response.status).toBe(404);

      expect(response.body).toMatchObject({
        success: false,
        message: "Product not found",
      });
    });
  });

  describe("GET /reviews/product/:productId", () => {
    it("should get product reviews", async () => {
      const { token, user } = await loginAdmin();

      const product = await createTestProduct();

      await request(app)
        .post(`/reviews/${product._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          rating: 5,
          comment: "Excellent product",
        });

      const profile = await Profile.findOne({
        userId: user._id,
      });

      const response = await request(app).get(
        `/reviews/product/${product._id}`,
      );

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.data).toHaveLength(1);

      expect(response.body.data[0]).toMatchObject({
        rating: 5,
        comment: "Excellent product",
        user: {
          firstName: profile?.firstName,
          lastName: profile?.lastName,
          avatar: profile?.avatar,
        },
      });
    });

    it("should return empty array when no reviews exist", async () => {
      const product = await createTestProduct();

      const response = await request(app).get(
        `/reviews/product/${product._id}`,
      );

      expect(response.status).toBe(200);

      expect(response.body.data).toHaveLength(0);

      expect(response.body.pagination.totalReviews).toBe(
        0,
      );
    });

    it("should support pagination", async () => {
      const { token } = await loginAdmin();

      const product = await createTestProduct();

      await request(app)
        .post(`/reviews/${product._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          rating: 5,
          comment: "Review 1",
        });

      const response = await request(app).get(
        `/reviews/product/${product._id}?page=1&limit=10`,
      );

      expect(response.status).toBe(200);

      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
      });
    });
  });

  describe("GET /reviews", () => {
    it("should get all reviews", async () => {
      const { token } = await loginAdmin();

      const product = await createTestProduct();

      await request(app)
        .post(`/reviews/${product._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          rating: 5,
          comment: "Excellent",
        });

      const response = await request(app)
        .get("/reviews")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);

      expect(response.body.data).toHaveLength(1);

      expect(
        response.body.pagination.totalReviews,
      ).toBe(1);
    });

    it("should support pagination", async () => {
      const { token } = await loginAdmin();

      const response = await request(app)
        .get("/reviews?page=1&limit=5")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);

      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 5,
      });
    });
  });

  describe("DELETE /reviews/:reviewId", () => {
    it("should delete review", async () => {
      const { token, user } = await loginAdmin();

      const product = await createTestProduct();

      const review = await Review.create({
        userId: user._id,
        productId: product._id,
        rating: 5,
        comment: "Excellent",
      });

      await Product.findByIdAndUpdate(product._id, {
        averageRating: 5,
        reviewsCount: 1,
      });

      const response = await request(app)
        .delete(`/reviews/${review._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        success: true,
        message: "Review deleted successfully",
      });
    });

    it("should recalculate product statistics after delete", async () => {
      const { token, user } = await loginAdmin();

      const product = await createTestProduct();

      const review = await Review.create({
        userId: user._id,
        productId: product._id,
        rating: 5,
        comment: "Excellent",
      });

      await Product.findByIdAndUpdate(product._id, {
        averageRating: 5,
        reviewsCount: 1,
      });

      await request(app)
        .delete(`/reviews/${review._id}`)
        .set("Authorization", `Bearer ${token}`);

      const updatedProduct = await Product.findById(
        product._id,
      );

      expect(updatedProduct?.averageRating).toBe(0);
      expect(updatedProduct?.reviewsCount).toBe(0);
    });

    it("should return 404 for missing review", async () => {
      const { token } = await loginAdmin();

      const response = await request(app)
        .delete(
          "/reviews/507f1f77bcf86cd799439011",
        )
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);

      expect(response.body).toMatchObject({
        success: false,
        message: "Review not found",
      });
    });
  });
});

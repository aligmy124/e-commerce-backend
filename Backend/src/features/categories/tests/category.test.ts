import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../../app";
import { Category } from "../../../models/categories/models/category.model";
import { createTestAdmin } from "../../../test/helpers/createTestAdmin";

describe("Category", () => {
  it("should admin create category", async () => {
    // Arrange
    const { user, password } = await createTestAdmin();

    // Login
    const responseLogin = await request(app).post("/auth/login").send({
      email: user.email,
      password,
    });

    expect(responseLogin.status).toBe(201);

    const token = responseLogin.body.data.token;

    // Act
    const responseCategory = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Laptops",
        description: "Laptops are popular devices",
        isActive: true,
      });

    // Assert
    expect(responseCategory.status).toBe(201);

    expect(responseCategory.body).toMatchObject({
      success: true,
      message: "Category created successfully",
    });

    expect(responseCategory.body.data).toBeDefined();

    expect(responseCategory.body.data).toMatchObject({
      name: "Laptops",
      description: "Laptops are popular devices",
      isActive: true,
    });
  });

  it("should reject normal user", async () => {
    // Arrange
    const email = `user-${Date.now()}@example.com`;

    await request(app).post("/auth/register").send({
      email,
      password: "password123",
      firstName: "Test",
      lastName: "User",
      phone: "+201000000001",
    });

    const responseLogin = await request(app).post("/auth/login").send({
      email,
      password: "password123",
    });

    expect(responseLogin.status).toBe(201);

    const token = responseLogin.body.data.token;

    // Act
    const responseCategory = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Laptops",
        description: "Laptops are popular devices",
        isActive: true,
      });

    // Assert
    expect(responseCategory.status).toBe(403);

    expect(responseCategory.body).toEqual({
      success: false,
      message: "Forbidden: You do not have permission to access this resource.",
    });
  });

  it("should reject additional parameters", async () => {
    // Arrange
    const { user, password } = await createTestAdmin();

    const responseLogin = await request(app).post("/auth/login").send({
      email: user.email,
      password,
    });

    const token = responseLogin.body.data.token;

    // Act
    const responseCategory = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Laptops",
        description: "Laptops are popular devices",
        isActive: true,

        // Not allowed
        randomField: "hacked",
      });

    // Assert
    expect(responseCategory.status).toBe(400);

    expect(responseCategory.body).toMatchObject({
      success: false,
      message: "Invalid data",
    });
  });

  it("should reject missing name", async () => {
    // Arrange
    const { user, password } = await createTestAdmin();

    const responseLogin = await request(app).post("/auth/login").send({
      email: user.email,
      password,
    });

    const token = responseLogin.body.data.token;

    // Act
    const responseCategory = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({
        description: "Laptops are popular devices",
        isActive: true,
      });

    // Assert
    expect(responseCategory.status).toBe(400);

    expect(responseCategory.body.success).toBe(false);
  });

  it("should reject invalid name", async () => {
    // Arrange
    const { user, password } = await createTestAdmin();

    const responseLogin = await request(app).post("/auth/login").send({
      email: user.email,
      password,
    });

    const token = responseLogin.body.data.token;

    // Act
    const responseCategory = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "A",
        description: "Laptops are popular devices",
        isActive: true,
      });

    // Assert
    expect(responseCategory.status).toBe(400);

    expect(responseCategory.body.success).toBe(false);
  });

  it("should reject invalid isActive", async () => {
    // Arrange
    const { user, password } = await createTestAdmin();

    const responseLogin = await request(app).post("/auth/login").send({
      email: user.email,
      password,
    });

    const token = responseLogin.body.data.token;

    // Act
    const responseCategory = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Laptops",
        description: "Laptops are popular devices",
        isActive: "invalid",
      });

    // Assert
    expect(responseCategory.status).toBe(400);

    expect(responseCategory.body.success).toBe(false);
  });

  it("should reject duplicate category name", async () => {
    // Arrange
    const { user, password } = await createTestAdmin();

    const responseLogin = await request(app).post("/auth/login").send({
      email: user.email,
      password,
    });

    const token = responseLogin.body.data.token;

    await Category.create({
      name: "Laptops",
      description: "Laptops are popular devices",
      isActive: true,
    });

    // Act
    const responseCategory = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Laptops",
        description: "Another description",
        isActive: true,
      });

    // Assert
    expect(responseCategory.status).toBe(409);

    expect(responseCategory.body.success).toBe(false);
  });
});

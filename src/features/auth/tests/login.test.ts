import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../../app";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env";
describe("Auth - Login", () => {
  it("should login successfully with valid credentials", async () => {
    await request(app).post("/auth/register").send({
      email: "user@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "User",
      phone: "+201000000001",
    });
    const response = await request(app).post("/auth/login").send({
      email: "user@example.com",
      password: "password123",
    });
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("User logged in successfully");
    expect(response.body.data).toHaveProperty("id");
    expect(response.body.data.email).toBe("user@example.com");
    expect(response.body.data).toHaveProperty("role");
    expect(response.body.data).toHaveProperty("token");
  });
  it("should reject login without email", async () => {
    const response = await request(app).post("/auth/login").send({
      password: "password123",
    });
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid data");
    expect(response.body.errors).toContainEqual({
      path: "email",
      message: "Email is required",
    });
  });
  it("should reject login without password", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "user@example.com",
    });
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid data");
    expect(response.body.errors).toContainEqual({
      path: "password",
      message: "Password is required",
    });
  });
  it("should reject login with invalid email format", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "invalid-email",
      password: "password123",
    });
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid data");
    expect(response.body.errors).toContainEqual({
      path: "email",
      message: "Invalid email format",
    });
  });
  it("should reject login with short password", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "user@example.com",
      password: "short",
    });
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid data");
    expect(response.body.errors).toContainEqual({
      path: "password",
      message: "Password must be at least 8 characters",
    });
  });
  it("should reject login when email does not exist in Database", async () => {
    await request(app).post("/auth/register").send({
      email: "user@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "User",
      phone: "+201000000001",
    });
    const response = await request(app).post("/auth/login").send({
      email: "user77@example.com",
      password: "password123",
    });
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid email or password");
  });
  it("should reject login with invalid password in Database", async () => {
    await request(app).post("/auth/register").send({
      email: "user@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "User",
      phone: "+201000000001",
    });
    const response = await request(app).post("/auth/login").send({
      email: "user@example.com",
      password: "password321",
    });
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid email or password");
  });
  it("should not return password", async () => {
    await request(app).post("/auth/register").send({
      email: "user@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "User",
      phone: "+201000000001",
    });
    const response = await request(app).post("/auth/login").send({
      email: "user@example.com",
      password: "password123",
    });
    
    expect(response.body.data).not.toHaveProperty("password");
  });
  it("should login return valid token", async () => {
    await request(app).post("/auth/register").send({
      email: "user@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "User",
      phone: "+201000000001",
    });
    const response = await request(app).post("/auth/login").send({
      email: "user@example.com",
      password: "password123",
    });
    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty("token");
    expect(response.body.data.token).toBeDefined();

    const decode = jwt.verify(
      response.body.data.token,
      env.JWT_SECRET,
    ) as jwt.JwtPayload;
    expect(decode).toHaveProperty("id");
    expect(decode).toHaveProperty("role");
  });
});

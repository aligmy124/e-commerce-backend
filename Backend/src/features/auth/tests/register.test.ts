import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../../../app";
import { User } from "../../../models/users/models/user.model";
import bcrypt from "bcrypt";

describe("Auth - Register", () => {
  it("should register a new user", async () => {
    const response = await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "User",
      phone: "+201000000000",
    });
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe("test@example.com");
  });
  it("should reject duplicate email", async () => {
    await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "User",
      phone: "+201000000000",
    });
    const response = await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "User",
      phone: "+201000000000",
    });
    expect(response.status).toBe(409);
    expect(response.body.message).toBe("Email already exists");
  });
  it("should hash the password", async () => {
    const password = "password123";

    await request(app).post("/auth/register").send({
      email: "hash@example.com",
      password,
      firstName: "Hash",
      lastName: "Test",
      phone: "+201000000002",
    });

    const user = await User.findOne({
      email: "hash@example.com",
    }).select("+password");
    const isPasswordValid = await bcrypt.compare(
      password,
      user?.password ?? "",
    );
    expect(user?.password).not.toBe(password);
    expect(isPasswordValid).toBe(true);
  });
  it("should reject registeration without email", async () => {
    const response = await request(app).post("/auth/register").send({
      password: "password123",
      firstName: "Test",
      lastName: "User",
      phone: "+201000000000",
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid data");
    expect(response.body.errors).toContainEqual({
      path: "email",
      message: "Email is required",
    });
  });
  it("should reject invalid email format", async () => {
    const response = await request(app).post("/auth/register").send({
      email: "invalid-email",
      password: "password123",
      firstName: "Test",
      lastName: "User",
      phone: "+201000000000",
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid data");
    expect(response.body.errors).toContainEqual({
      path: "email",
      message: "Invalid email format",
    });
  });
  it("should reject invalid phone number format", async () => {
    const response = await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "User",
      phone: "",
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid data");
    expect(response.body.errors).toContainEqual({
      path: "phone",
      message: "Phone number is required",
    });
  });
  it("should reject missing phone", async () => {
    const response = await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "User",
      phone: "12345",
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid data");
    expect(response.body.errors).toContainEqual({
      path: "phone",
      message: "Please enter a valid phone number",
    });
  });
  it("should reject short password", async () => {
    const response = await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "short",
      firstName: "Test",
      lastName: "User",
      phone: "+201000000000",
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid data");
    expect(response.body.errors).toContainEqual({
      path: "password",
      message: "Password must be at least 8 characters",
    });
  });
  it("should reject short first name", async () => {
    const response = await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "password123",
      firstName: "Te",
      lastName: "User",
      phone: "+201000000000",
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid data");
    expect(response.body.errors).toContainEqual({
      path: "firstName",
      message: "firstName must be at least 3 characters",
    });
  });
  it("should reject short last name", async () => {
    const response = await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "Us",
      phone: "+201000000000",
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid data");
    expect(response.body.errors).toContainEqual({
      path: "lastName",
      message: "lastName must be at least 3 characters",
    });
  });
  it("should reject extra fields", async () => {
    const response = await request(app).post("/auth/register").send({
      email: "test@example.com",
      password: "password123",
      firstName: "Test",
      lastName: "User",
      phone: "+201000000000",
      role: "admin",
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid data");
  });
});

import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../../app";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env";

describe("Authenticate", () => {
  it("should authenticate a user with valid credentials", async () => {
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

    const res = await request(app)
      .get("/auth/protected")
      .set("Authorization", `Bearer ${response.body.data.token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user).toHaveProperty("role");
    expect(res.body.user.id).toBe(response.body.data.id);
    expect(res.body.user.role).toBe(response.body.data.role);
  });
  it("should reject unauthorized requests", async () => {
    const res = await request(app).get("/auth/protected");
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("success", false);
    expect(res.body.message).toBe("Unauthorized");
  });
  it("should reject requests with invalid token", async () => {
    const res = await request(app)
      .get("/auth/protected")
      .set("Authorization", "Bearer invalidtoken");
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("success", false);
    expect(res.body.message).toBe("Invalid token");
  });
  it("should reject requests with expired token", async () => {
    const expiredToken = jwt.sign(
      { id: "userId", role: "user" },
      env.JWT_SECRET,
      { expiresIn: "-1h" },
    );
    const res = await request(app)
      .get("/auth/protected")
      .set("Authorization", `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("success", false);
    expect(res.body.message).toBe("Token expired");
  });
  it("should reject Invalid Bearer format", async () => {
    const res = await request(app)
      .get("/auth/protected")
      .set("Authorization", "InvalidBearerFormat");
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("success", false);
    expect(res.body.message).toBe("Invalid Bearer format");
  });
});

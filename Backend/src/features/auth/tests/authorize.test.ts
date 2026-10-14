import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../app";
import { createTestAdmin } from "../../../test/helpers/createTestAdmin";

describe("authorize", () => {
  it("should return 403 if user does not have permission to access the resource", async () => {
    const email = `user-${Date.now()}@example.com`;

    // Create normal user
    const responseRegister = await request(app).post("/auth/register").send({
      email,
      password: "password123",
      firstName: "Test",
      lastName: "User",
      phone: "+201000000001",
    });

    expect(responseRegister.status).toBe(201);

    // Login
    const responseLogin = await request(app).post("/auth/login").send({
      email,
      password: "password123",
    });

    expect(responseLogin.status).toBe(201);
    expect(responseLogin.body.data).toHaveProperty("token");

    const token = responseLogin.body.data.token;

    // Access admin-only resource
    const response = await request(app)
      .get("/auth/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);

    expect(response.body).toEqual({
      success: false,
      message: "Forbidden: You do not have permission to access this resource.",
    });
  });

  it("should return 200 if admin has permission to access the resource", async () => {
    // Create admin
    const { user, password } = await createTestAdmin();

    // Login
    const responseLogin = await request(app).post("/auth/login").send({
      email: user.email,
      password,
    });

    expect(responseLogin.status).toBe(201);
    expect(responseLogin.body.data).toHaveProperty("token");

    const token = responseLogin.body.data.token;

    // Access admin-only resource
    const response = await request(app)
      .get("/auth/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
  });
});

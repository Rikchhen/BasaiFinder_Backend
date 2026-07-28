import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app";
import { registerUser } from "./helpers";

describe("auth", () => {
  it("registers a tenant and returns the user without a password", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Sita Tenant",
      email: `sita_${Date.now()}@test.com`,
      phone: "9800000001",
      password: "Test1234",
      role: "tenant",
    });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("tenant");
    expect(res.body.user.password).toBeUndefined();
  });

  it("rejects a registration with an invalid phone number", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Bad Phone",
      email: `bad_${Date.now()}@test.com`,
      phone: "12345",
      password: "Test1234",
      role: "tenant",
    });

    expect(res.status).toBe(400);
  });

  it("refuses to create an admin through public registration", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Sneaky Admin",
      email: `sneaky_${Date.now()}@test.com`,
      phone: "9800000002",
      password: "Test1234",
      role: "admin",
    });

    // The role enum only allows tenant/landlord, so this must not yield an admin.
    expect(res.body?.user?.role).not.toBe("admin");
  });

  it("rejects login with a wrong password", async () => {
    const user = await registerUser("tenant");
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "WrongPassword" });

    expect(res.status).toBe(401);
  });

  it("blocks protected routes without a session cookie", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the current user with a valid cookie", async () => {
    const user = await registerUser("landlord");
    const res = await request(app).get("/api/auth/me").set("Cookie", user.cookie);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
  });
});

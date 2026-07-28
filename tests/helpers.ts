import request from "supertest";
import app from "../src/app";
import { User, UserRole } from "../src/models/User";

let counter = 0;

export interface TestUser {
  cookie: string[];
  id: string;
  email: string;
}

function uniqueEmail(role: string): string {
  counter += 1;
  return `${role}${counter}_${Date.now()}@test.com`;
}

function uniquePhone(): string {
  counter += 1;
  return `9${String(800000000 + counter).slice(0, 9)}`;
}

/** Registers a tenant or landlord and returns their auth cookie. */
export async function registerUser(role: "tenant" | "landlord"): Promise<TestUser> {
  const email = uniqueEmail(role);
  const res = await request(app).post("/api/auth/register").send({
    name: `${role} tester`,
    email,
    phone: uniquePhone(),
    password: "Test1234",
    role,
  });

  if (res.status !== 201 && res.status !== 200) {
    throw new Error(`register failed (${res.status}): ${JSON.stringify(res.body)}`);
  }

  return { cookie: res.headers["set-cookie"] as unknown as string[], id: res.body.user.id, email };
}

/**
 * Admins cannot self-register (by design), so create the record directly and
 * then log in through the normal endpoint.
 */
export async function createAdmin(): Promise<TestUser> {
  const email = uniqueEmail("admin");
  // The model hashes passwordHash on save, so pass the plain password there.
  await User.create({
    name: "admin tester",
    email,
    phone: uniquePhone(),
    passwordHash: "Test1234",
    role: "admin" as UserRole,
  });

  const res = await request(app).post("/api/auth/login").send({ email, password: "Test1234" });
  if (res.status !== 200) {
    throw new Error(`admin login failed (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return { cookie: res.headers["set-cookie"] as unknown as string[], id: res.body.user.id, email };
}

/** Creates a listing owned by the given landlord. */
export async function createListing(landlord: TestUser, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post("/api/listings")
    .set("Cookie", landlord.cookie)
    .field("title", (overrides.title as string) || "Test room near Patan")
    .field("type", (overrides.type as string) || "Studio")
    .field("price", String(overrides.price ?? 15000))
    .field(
      "location",
      JSON.stringify({ address: "Test Rd", neighborhood: "Patan", district: "Lalitpur" }),
    );

  if (res.status !== 201) {
    throw new Error(`createListing failed (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return res.body.listing;
}

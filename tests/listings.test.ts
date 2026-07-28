import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app";
import { createAdmin, createListing, registerUser } from "./helpers";

describe("listings", () => {
  it("stops a tenant from creating a listing", async () => {
    const tenant = await registerUser("tenant");
    const res = await request(app)
      .post("/api/listings")
      .set("Cookie", tenant.cookie)
      .field("title", "Tenant should not post this")
      .field("type", "Studio")
      .field("price", "12000")
      .field(
        "location",
        JSON.stringify({ address: "A", neighborhood: "Patan", district: "Lalitpur" }),
      );

    expect(res.status).toBe(403);
  });

  it("creates a listing as pending so it is not verified by default", async () => {
    const landlord = await registerUser("landlord");
    const listing = await createListing(landlord);

    expect(listing.status).toBe("pending");
  });

  it("stops a landlord from editing someone else's listing", async () => {
    const owner = await registerUser("landlord");
    const other = await registerUser("landlord");
    const listing = await createListing(owner);

    const res = await request(app)
      .patch(`/api/listings/${listing._id}`)
      .set("Cookie", other.cookie)
      .send({ price: 1 });

    expect(res.status).toBe(403);
  });

  it("lets the owner edit their own listing", async () => {
    const owner = await registerUser("landlord");
    const listing = await createListing(owner);

    const res = await request(app)
      .patch(`/api/listings/${listing._id}`)
      .set("Cookie", owner.cookie)
      .send({ price: 19500 });

    expect(res.status).toBe(200);
    expect(res.body.listing.price).toBe(19500);
  });

  it("stops a landlord from verifying their own listing", async () => {
    const landlord = await registerUser("landlord");
    const listing = await createListing(landlord);

    const res = await request(app)
      .patch(`/api/listings/${listing._id}/status`)
      .set("Cookie", landlord.cookie)
      .send({ status: "verified" });

    expect(res.status).toBe(403);
  });

  it("lets an admin verify a listing", async () => {
    const landlord = await registerUser("landlord");
    const admin = await createAdmin();
    const listing = await createListing(landlord);

    const res = await request(app)
      .patch(`/api/listings/${listing._id}/status`)
      .set("Cookie", admin.cookie)
      .send({ status: "verified" });

    expect(res.status).toBe(200);
    expect(res.body.listing.status).toBe("verified");
  });

  it("filters listings by price range", async () => {
    const landlord = await registerUser("landlord");
    await createListing(landlord, { title: "Cheap room", price: 9000 });
    await createListing(landlord, { title: "Pricey room", price: 60000 });

    const res = await request(app).get("/api/listings?maxPrice=10000");

    expect(res.status).toBe(200);
    expect(res.body.listings).toHaveLength(1);
    expect(res.body.listings[0].title).toBe("Cheap room");
  });

  it("increments the view counter when a listing is opened", async () => {
    const landlord = await registerUser("landlord");
    const listing = await createListing(landlord);

    await request(app).get(`/api/listings/${listing._id}`);
    const res = await request(app).get(`/api/listings/${listing._id}`);

    expect(res.body.listing.viewsCount).toBeGreaterThanOrEqual(2);
  });
});

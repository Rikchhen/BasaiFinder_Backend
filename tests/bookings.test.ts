import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../src/app";
import { createListing, registerUser } from "./helpers";

async function bookingFixture() {
  const landlord = await registerUser("landlord");
  const tenant = await registerUser("tenant");
  const listing = await createListing(landlord);

  const res = await request(app)
    .post("/api/bookings")
    .set("Cookie", tenant.cookie)
    .send({ listing: listing._id, message: "Can I visit?" });

  return { landlord, tenant, listing, booking: res.body.booking, status: res.status };
}

describe("bookings", () => {
  it("creates a booking in the pending state", async () => {
    const { status, booking } = await bookingFixture();

    expect(status).toBe(201);
    expect(booking.status).toBe("pending");
    expect(booking.documentsSubmitted).toBe(false);
  });

  it("stops a landlord from creating a booking", async () => {
    const landlord = await registerUser("landlord");
    const listing = await createListing(landlord);

    const res = await request(app)
      .post("/api/bookings")
      .set("Cookie", landlord.cookie)
      .send({ listing: listing._id });

    expect(res.status).toBe(403);
  });

  it("counts the booking as a lead on the listing", async () => {
    const { listing } = await bookingFixture();
    const res = await request(app).get(`/api/listings/${listing._id}`);

    expect(res.body.listing.leadsCount).toBe(1);
  });

  it("notifies the landlord about the new visit request", async () => {
    const { landlord } = await bookingFixture();
    const res = await request(app).get("/api/notifications").set("Cookie", landlord.cookie);

    expect(res.status).toBe(200);
    expect(res.body.unreadCount).toBeGreaterThanOrEqual(1);
    expect(res.body.notifications[0].type).toBe("booking_update");
  });

  it("hides a booking from an unrelated user", async () => {
    const { booking } = await bookingFixture();
    const stranger = await registerUser("tenant");

    const res = await request(app)
      .get(`/api/bookings/${booking._id}`)
      .set("Cookie", stranger.cookie);

    expect(res.status).toBe(403);
  });

  it("lets the landlord confirm a visit", async () => {
    const { landlord, booking } = await bookingFixture();

    const res = await request(app)
      .patch(`/api/bookings/${booking._id}/status`)
      .set("Cookie", landlord.cookie)
      .send({ status: "visit_confirmed" });

    expect(res.status).toBe(200);
    expect(res.body.booking.status).toBe("visit_confirmed");
  });

  it("marks documents as submitted when moving to document_review", async () => {
    const { landlord, booking } = await bookingFixture();

    const res = await request(app)
      .patch(`/api/bookings/${booking._id}/status`)
      .set("Cookie", landlord.cookie)
      .send({ status: "document_review" });

    expect(res.status).toBe(200);
    expect(res.body.booking.documentsSubmitted).toBe(true);
  });

  it("rejects an unknown status value", async () => {
    const { landlord, booking } = await bookingFixture();

    const res = await request(app)
      .patch(`/api/bookings/${booking._id}/status`)
      .set("Cookie", landlord.cookie)
      .send({ status: "teleported" });

    expect(res.status).toBe(400);
  });

  it("stops an unrelated user from changing a booking status", async () => {
    const { booking } = await bookingFixture();
    const stranger = await registerUser("landlord");

    const res = await request(app)
      .patch(`/api/bookings/${booking._id}/status`)
      .set("Cookie", stranger.cookie)
      .send({ status: "rejected" });

    expect(res.status).toBe(403);
  });

  it("scopes /bookings/mine to each side of the booking", async () => {
    const { landlord, tenant } = await bookingFixture();

    const landlordRes = await request(app).get("/api/bookings/mine").set("Cookie", landlord.cookie);
    const tenantRes = await request(app).get("/api/bookings/mine").set("Cookie", tenant.cookie);
    const stranger = await registerUser("tenant");
    const strangerRes = await request(app).get("/api/bookings/mine").set("Cookie", stranger.cookie);

    expect(landlordRes.body.bookings).toHaveLength(1);
    expect(tenantRes.body.bookings).toHaveLength(1);
    expect(strangerRes.body.bookings).toHaveLength(0);
  });
});

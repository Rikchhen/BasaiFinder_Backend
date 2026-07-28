import { Request, Response } from "express";
import { BookingRequest } from "../models/BookingRequest";
import { Listing } from "../models/Listing";
import { ApiError } from "../utils/ApiError";
import { getPagination, buildPaginationMeta } from "../utils/paginate";
import { createNotification } from "./notification.controller";

export async function createBooking(req: Request, res: Response) {
  const { listing: listingId, message, requestedVisitTime } = req.body;

  const listing = await Listing.findById(listingId);
  if (!listing) throw ApiError.notFound("Listing not found.");

  const booking = await BookingRequest.create({
    tenant: req.user!.id,
    landlord: listing.landlord,
    listing: listing.id,
    message,
    requestedVisitTime,
  });

  listing.leadsCount += 1;
  await listing.save();

  await createNotification(listing.landlord.toString(), {
    type: "booking_update",
    title: "New visit request",
    body: `${req.user!.name} requested a visit for "${listing.title}".`,
    link: `/bookings/${booking.id}`,
  });

  res.status(201).json({ booking });
}

export async function getMyBookings(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req);
  const filter = req.user!.role === "landlord" ? { landlord: req.user!.id } : { tenant: req.user!.id };

  const [bookings, total] = await Promise.all([
    BookingRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("listing", "title location price images")
      .populate("tenant", "name avatarUrl tenantProfile")
      .populate("landlord", "name avatarUrl"),
    BookingRequest.countDocuments(filter),
  ]);

  res.json({ bookings, meta: buildPaginationMeta(page, limit, total) });
}

export async function getBooking(req: Request, res: Response) {
  const booking = await BookingRequest.findById(req.params.id);
  if (!booking) throw ApiError.notFound("Booking not found.");

  const userId = req.user!.id;
  const isParty = booking.tenant.toString() === userId || booking.landlord.toString() === userId;
  if (!isParty && req.user!.role !== "admin") {
    throw ApiError.forbidden("You don't have access to this booking.");
  }

  await booking.populate([
    { path: "listing" },
    { path: "tenant", select: "name avatarUrl tenantProfile" },
    { path: "landlord", select: "name avatarUrl" },
  ]);

  res.json({ booking });
}

export async function updateBookingStatus(req: Request, res: Response) {
  const booking = await BookingRequest.findById(req.params.id);
  if (!booking) throw ApiError.notFound("Booking not found.");

  const userId = req.user!.id;
  const isLandlord = booking.landlord.toString() === userId;
  const isTenant = booking.tenant.toString() === userId;
  if (!isLandlord && !isTenant && req.user!.role !== "admin") {
    throw ApiError.forbidden("You don't have access to this booking.");
  }

  booking.status = req.body.status;
  if (req.body.status === "document_review") booking.documentsSubmitted = true;
  await booking.save();

  const recipientId = isTenant ? booking.landlord.toString() : booking.tenant.toString();
  await createNotification(recipientId, {
    type: "booking_update",
    title: "Booking status updated",
    body: `Your booking request is now "${booking.status.replace(/_/g, " ")}".`,
    link: `/bookings/${booking.id}`,
  });

  res.json({ booking });
}

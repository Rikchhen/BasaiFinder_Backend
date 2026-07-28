import { Request, Response } from "express";
import { Types } from "mongoose";
import { SavedRoom } from "../models/SavedRoom";
import { BookingRequest } from "../models/BookingRequest";
import { Listing } from "../models/Listing";
import { Message } from "../models/Message";
import { Conversation } from "../models/Conversation";

export async function getTenantDashboard(req: Request, res: Response) {
  const userId = req.user!.id;

  const conversationIds: Types.ObjectId[] = await Conversation.find({ participants: userId }).distinct("_id");

  const [savedRoomsCount, visitsBookedCount, pendingRepliesCount, activeRequests, recommendedRooms] =
    await Promise.all([
      SavedRoom.countDocuments({ user: userId }),
      BookingRequest.countDocuments({
        tenant: userId,
        status: { $in: ["visit_requested", "visit_confirmed"] },
      }),
      Message.countDocuments({
        conversation: { $in: conversationIds },
        sender: { $ne: userId },
        readBy: { $ne: userId },
      }),
      BookingRequest.find({
        tenant: userId,
        status: { $nin: ["completed", "cancelled", "rejected"] },
      })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate("listing", "title location images")
        .populate("landlord", "name avatarUrl"),
      Listing.find({ status: "verified", isActive: true }).sort({ createdAt: -1 }).limit(3),
    ]);

  res.json({
    tenantScore: req.user!.tenantProfile.score,
    savedRoomsCount,
    visitsBookedCount,
    pendingRepliesCount,
    activeRequests,
    recommendedRooms,
  });
}

export async function getLandlordDashboard(req: Request, res: Response) {
  const userId = req.user!.id;

  const [activeListingsCount, verifiedListingsCount, tenantLeadsCount, listings, tenantRequests, completedBookings] =
    await Promise.all([
      Listing.countDocuments({ landlord: userId, isActive: true }),
      Listing.countDocuments({ landlord: userId, isActive: true, status: "verified" }),
      BookingRequest.countDocuments({ landlord: userId }),
      Listing.find({ landlord: userId }).sort({ createdAt: -1 }).limit(5),
      BookingRequest.find({ landlord: userId })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate("tenant", "name avatarUrl tenantProfile")
        .populate("listing", "title"),
      BookingRequest.find({ landlord: userId, status: "completed" }).populate("listing", "price"),
    ]);

  const occupancyRate = activeListingsCount
    ? Math.round((verifiedListingsCount / activeListingsCount) * 100)
    : 0;

  const rentCollected = completedBookings.reduce((total, booking) => {
    const listing = booking.listing as unknown as { price?: number } | null;
    return total + (listing?.price || 0);
  }, 0);

  res.json({
    activeListingsCount,
    tenantLeadsCount,
    occupancyRate,
    rentCollected,
    listings,
    tenantRequests,
  });
}

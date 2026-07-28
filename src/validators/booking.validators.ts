import { z } from "zod";

export const createBookingSchema = z.object({
  listing: z.string().trim().min(1, "listing is required."),
  message: z.string().trim().max(1000).optional(),
  requestedVisitTime: z.coerce.date().optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum([
    "pending",
    "document_review",
    "visit_requested",
    "visit_confirmed",
    "completed",
    "cancelled",
    "rejected",
  ]),
});

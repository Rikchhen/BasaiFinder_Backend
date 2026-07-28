import { z } from "zod";

const LISTING_TYPES = ["Single Room", "Studio", "1BHK", "2BHK", "Apartment"] as const;

export const createListingSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters."),
  description: z.string().trim().optional(),
  type: z.enum(LISTING_TYPES),
  price: z.coerce.number().positive("Price must be greater than 0."),
  location: z.object({
    address: z.string().trim().min(3),
    neighborhood: z.string().trim().min(2),
    district: z.string().trim().min(2),
    city: z.string().trim().optional(),
  }),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().int().min(0).optional(),
  areaSqft: z.coerce.number().positive().optional(),
  amenities: z.array(z.string().trim()).optional(),
});

export const updateListingSchema = createListingSchema.partial().extend({
  // Only paths this server already handed out; new photos go through POST /:id/images.
  images: z.array(z.string().trim().regex(/^\/uploads\/listings\/[\w.-]+$/)).optional(),
});

export const updateListingStatusSchema = z.object({
  status: z.enum(["draft", "pending", "verified", "rejected"]),
});

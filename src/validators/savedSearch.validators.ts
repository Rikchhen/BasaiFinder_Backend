import { z } from "zod";

export const createSavedSearchSchema = z.object({
  title: z.string().trim().min(3),
  filters: z
    .object({
      location: z.string().trim().optional(),
      roomType: z.string().trim().optional(),
      minPrice: z.coerce.number().nonnegative().optional(),
      maxPrice: z.coerce.number().nonnegative().optional(),
      amenities: z.array(z.string().trim()).optional(),
    })
    .default({}),
  emailAlertsEnabled: z.boolean().default(true),
});

export const updateSavedSearchSchema = createSavedSearchSchema.partial();

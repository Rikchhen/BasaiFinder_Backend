import { z } from "zod";

export const neighborhoodSchema = z.object({
  name: z.string().trim().min(2),
  vibe: z.string().trim().min(2),
  description: z.string().trim().min(10),
  image: z.url(),
  rentRange: z.object({
    singleMin: z.coerce.number().nonnegative(),
    singleMax: z.coerce.number().nonnegative(),
    flatMin: z.coerce.number().nonnegative(),
    flatMax: z.coerce.number().nonnegative(),
  }),
  features: z.array(z.string().trim()).default([]),
  mapPosition: z.object({
    top: z.string().trim(),
    left: z.string().trim(),
    type: z.enum(["blue", "green", "red"]).default("blue"),
  }),
});

export const updateNeighborhoodSchema = neighborhoodSchema.partial();

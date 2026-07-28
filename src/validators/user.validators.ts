import { z } from "zod";

export const updateMeSchema = z.object({
  name: z.string().trim().min(2).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^9\d{9}$/, "Enter a valid 10-digit Nepal mobile number.")
    .optional(),
  address: z.string().trim().optional(),
  tenantProfile: z
    .object({
      documentsReady: z.boolean().optional(),
      employmentProofSubmitted: z.boolean().optional(),
    })
    .partial()
    .optional(),
  landlordProfile: z
    .object({
      organizationName: z.string().trim().optional(),
      businessAddress: z.string().trim().optional(),
      bio: z.string().trim().max(1000).optional(),
      businessName: z.string().trim().optional(),
      bankAccountHolder: z.string().trim().optional(),
      bankName: z.string().trim().optional(),
      taxNumber: z.string().trim().optional(),
    })
    .partial()
    .optional(),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(6, "New password must be at least 6 characters."),
});

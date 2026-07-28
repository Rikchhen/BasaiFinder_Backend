import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .regex(/^9\d{9}$/, "Enter a valid 10-digit Nepal mobile number."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.enum(["tenant", "landlord"]).default("tenant"),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address."),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters."),
});

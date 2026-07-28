import { z } from "zod";

export const createConversationSchema = z.object({
  recipient: z.string().trim().min(1, "recipient is required."),
  listing: z.string().trim().optional(),
  text: z.string().trim().min(1).optional(),
});

export const createMessageSchema = z.object({
  text: z.string().trim().min(1, "Message text is required."),
});

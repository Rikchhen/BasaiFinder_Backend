import { Router } from "express";
import * as conversationController from "../controllers/conversation.controller";
import { protect } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createConversationSchema, createMessageSchema } from "../validators/conversation.validators";

const router = Router();

router.use(protect);

router.get("/", conversationController.listConversations);
router.post("/", validate(createConversationSchema), conversationController.createConversation);
router.get("/:id/messages", conversationController.listMessages);
router.post(
  "/:id/messages",
  validate(createMessageSchema),
  conversationController.createMessage,
);
router.patch("/:id/read", conversationController.markConversationRead);
router.delete("/:id", conversationController.deleteConversation);

export default router;

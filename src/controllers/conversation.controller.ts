import { Request, Response } from "express";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { ApiError } from "../utils/ApiError";
import { getPagination, buildPaginationMeta } from "../utils/paginate";
import { emitToUser, isUserOnline } from "../sockets";
import { createNotification } from "./notification.controller";

async function findParticipantConversation(id: string, userId: string) {
  const conversation = await Conversation.findOne({ _id: id, participants: userId });
  if (!conversation) throw ApiError.notFound("Conversation not found.");
  return conversation;
}

/** When this user last cleared the thread, or null if they never have. */
function clearedAtFor(
  conversation: { clearedBy?: { user: unknown; at: Date }[] },
  userId: string,
): Date | null {
  const entry = (conversation.clearedBy || []).find((item) => String(item.user) === userId);
  return entry ? entry.at : null;
}

async function deliverMessage(conversationId: string, senderId: string, text: string) {
  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    text,
    readBy: [senderId],
  });

  const conversation = await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: text,
    lastMessageAt: new Date(),
  });

  const recipientId = conversation!.participants.find((p) => p.toString() !== senderId);
  if (recipientId) {
    emitToUser(recipientId.toString(), "message:new", message);
    await createNotification(recipientId.toString(), {
      type: "message",
      title: "New message",
      body: text.length > 80 ? `${text.slice(0, 80)}...` : text,
      link: `/conversations/${conversationId}`,
    });
  }

  return message;
}

export async function listConversations(req: Request, res: Response) {
  const userId = req.user!.id;
  const conversations = await Conversation.find({ participants: userId })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .populate("participants", "name avatarUrl role")
    .populate("listing", "title images");

  const visible = await Promise.all(
    conversations.map(async (conversation) => {
      const clearedAt = clearedAtFor(conversation, userId);
      // A cleared thread stays hidden until the other side sends something new.
      if (clearedAt && (!conversation.lastMessageAt || conversation.lastMessageAt <= clearedAt)) {
        return null;
      }

      const unreadCount = await Message.countDocuments({
        conversation: conversation.id,
        sender: { $ne: userId },
        readBy: { $ne: userId },
        ...(clearedAt ? { createdAt: { $gt: clearedAt } } : {}),
      });

      const plain = { ...conversation.toObject(), unreadCount };
      delete (plain as { clearedBy?: unknown }).clearedBy;
      return plain;
    }),
  );

  res.json({ conversations: visible.filter(Boolean) });
}

export async function createConversation(req: Request, res: Response) {
  const { recipient, listing, text } = req.body;
  const userId = req.user!.id;

  if (recipient === userId) throw ApiError.badRequest("You can't message yourself.");

  let conversation = await Conversation.findOne({
    participants: { $all: [userId, recipient], $size: 2 },
    ...(listing ? { listing } : {}),
  });

  const isNew = !conversation;
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId, recipient],
      listing,
    });

    // Now that these two share a conversation, exchange current online status
    // so a chat started mid-session shows presence without a reconnect.
    if (isUserOnline(recipient)) emitToUser(userId, "presence:update", { userId: recipient, online: true });
    if (isUserOnline(userId)) emitToUser(recipient, "presence:update", { userId, online: true });
  }

  if (text) {
    await deliverMessage(conversation.id, userId, text);
  }

  if (isNew) {
    // Push the fully populated thread so the recipient's open Messages page can
    // show it without a refresh.
    const populated = await Conversation.findById(conversation.id)
      .populate("participants", "name avatarUrl role")
      .populate("listing", "title images");
    if (populated) {
      emitToUser(recipient, "conversation:new", {
        ...populated.toObject(),
        unreadCount: text ? 1 : 0,
      });
    }
  }

  res.status(201).json({ conversation });
}

export async function listMessages(req: Request, res: Response) {
  const conversation = await findParticipantConversation(String(req.params.id), req.user!.id);
  const { page, limit, skip } = getPagination(req, 30);

  // History from before this user cleared the chat stays hidden from them.
  const clearedAt = clearedAtFor(conversation, req.user!.id);
  const filter = {
    conversation: conversation.id,
    ...(clearedAt ? { createdAt: { $gt: clearedAt } } : {}),
  };

  const [messages, total] = await Promise.all([
    Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Message.countDocuments(filter),
  ]);

  res.json({ messages: messages.reverse(), meta: buildPaginationMeta(page, limit, total) });
}

/**
 * "Delete for me": hides the thread and its history from the caller only.
 * The other participant keeps their copy, and the thread returns to the
 * caller's list if the other side sends a new message.
 */
export async function deleteConversation(req: Request, res: Response) {
  const userId = req.user!.id;
  const conversation = await findParticipantConversation(String(req.params.id), userId);

  await Conversation.updateOne(
    { _id: conversation.id },
    { $pull: { clearedBy: { user: userId } } },
  );
  await Conversation.updateOne(
    { _id: conversation.id },
    { $push: { clearedBy: { user: userId, at: new Date() } } },
  );

  res.status(204).send();
}

export async function createMessage(req: Request, res: Response) {
  const conversation = await findParticipantConversation(String(req.params.id), req.user!.id);
  const message = await deliverMessage(conversation.id, req.user!.id, req.body.text);
  res.status(201).json({ message });
}

export async function markConversationRead(req: Request, res: Response) {
  const conversation = await findParticipantConversation(String(req.params.id), req.user!.id);
  await Message.updateMany(
    { conversation: conversation.id, readBy: { $ne: req.user!.id } },
    { $addToSet: { readBy: req.user!.id } },
  );

  // Let the other participant's open thread flip their sent messages to "Seen".
  const other = conversation.participants.find((p) => p.toString() !== req.user!.id);
  if (other) {
    emitToUser(other.toString(), "conversation:read", {
      conversationId: conversation.id,
      userId: req.user!.id,
      readAt: new Date(),
    });
  }

  res.status(204).send();
}

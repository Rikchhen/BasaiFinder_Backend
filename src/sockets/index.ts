import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { env } from "../config/env";
import { verifyToken } from "../utils/jwt";
import { Conversation } from "../models/Conversation";

let io: Server | null = null;

// Number of live socket connections per user (a user may have several tabs open).
const onlineCounts = new Map<string, number>();

function userRoom(userId: string): string {
  return `user:${userId}`;
}

export function isUserOnline(userId: string): boolean {
  return (onlineCounts.get(userId) || 0) > 0;
}

// The distinct set of users this person shares a conversation with.
async function partnerIdsFor(userId: string): Promise<string[]> {
  const conversations = await Conversation.find({ participants: userId }).select("participants");
  const partners = new Set<string>();
  for (const conversation of conversations) {
    for (const participant of conversation.participants) {
      const id = participant.toString();
      if (id !== userId) partners.add(id);
    }
  }
  return [...partners];
}

function readCookie(rawCookieHeader: string, name: string): string | undefined {
  for (const pair of rawCookieHeader.split(";")) {
    const separatorIndex = pair.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = pair.slice(0, separatorIndex).trim();
    if (key === name) {
      return decodeURIComponent(pair.slice(separatorIndex + 1).trim());
    }
  }
  return undefined;
}

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: env.clientUrls, credentials: true },
  });

  io.use((socket: Socket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie;
      if (!rawCookie) throw new Error("No auth cookie provided.");

      const token = readCookie(rawCookie, env.cookieName);
      if (!token) throw new Error("No auth token found.");

      const payload = verifyToken(token);
      socket.data.userId = payload.id;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket: Socket) => {
    const userId: string = socket.data.userId;
    socket.join(userRoom(userId));

    const previousConnections = onlineCounts.get(userId) || 0;
    onlineCounts.set(userId, previousConnections + 1);

    try {
      const partners = await partnerIdsFor(userId);
      // Tell this client which of its chat partners are already online.
      socket.emit(
        "presence:snapshot",
        partners.filter((id) => isUserOnline(id)),
      );
      // If this user just came online (first tab), let their partners know.
      if (previousConnections === 0) {
        partners.forEach((id) => emitToUser(id, "presence:update", { userId, online: true }));
      }
    } catch {
      // presence is best-effort; ignore lookup failures
    }

    // Relay typing indicators to the other participant of a conversation.
    socket.on(
      "typing",
      (payload: { conversationId?: string; toUserId?: string; isTyping?: boolean }) => {
        if (!payload?.conversationId || !payload?.toUserId) return;
        emitToUser(payload.toUserId, "typing", {
          conversationId: payload.conversationId,
          userId,
          isTyping: Boolean(payload.isTyping),
        });
      },
    );

    socket.on("disconnect", async () => {
      const remaining = (onlineCounts.get(userId) || 1) - 1;
      if (remaining > 0) {
        onlineCounts.set(userId, remaining);
        return;
      }
      onlineCounts.delete(userId);
      try {
        const partners = await partnerIdsFor(userId);
        partners.forEach((id) => emitToUser(id, "presence:update", { userId, online: false }));
      } catch {
        // ignore
      }
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.io has not been initialized yet.");
  return io;
}

export function emitToUser(userId: string, event: string, payload: unknown): void {
  if (!io) return;
  io.to(userRoom(userId)).emit(event, payload);
}

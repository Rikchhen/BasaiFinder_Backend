import { Request, Response } from "express";
import { Notification, NotificationType } from "../models/Notification";
import { getPagination, buildPaginationMeta } from "../utils/paginate";
import { emitToUser } from "../sockets";

export async function createNotification(
  userId: string,
  data: { type: NotificationType; title: string; body: string; link?: string },
) {
  const notification = await Notification.create({ user: userId, ...data });
  emitToUser(userId, "notification:new", notification);
  return notification;
}

export async function listNotifications(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req, 20);
  const filter = { user: req.user!.id };

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, read: false }),
  ]);

  res.json({ notifications, unreadCount, meta: buildPaginationMeta(page, limit, total) });
}

export async function markNotificationRead(req: Request, res: Response) {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user!.id },
    { read: true },
    { new: true },
  );
  res.json({ notification });
}

export async function markAllNotificationsRead(req: Request, res: Response) {
  await Notification.updateMany({ user: req.user!.id, read: false }, { read: true });
  res.status(204).send();
}

import { Request, Response } from "express";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { toUserResponse } from "../utils/serialize";
import { toPublicPath } from "../middleware/upload";
import { getPagination, buildPaginationMeta } from "../utils/paginate";
import { createNotification } from "./notification.controller";

export async function getMe(req: Request, res: Response) {
  res.json({ user: toUserResponse(req.user!) });
}

// --- admin only ---

export async function listUsers(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req, 20);
  const filter: Record<string, unknown> = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.verified === "true") filter.verified = true;
  if (req.query.verified === "false") filter.verified = false;

  const [users, total] = await Promise.all([
    User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({ users, meta: buildPaginationMeta(page, limit, total) });
}

export async function setUserVerified(req: Request, res: Response) {
  const verified = Boolean(req.body.verified);
  const user = await User.findByIdAndUpdate(req.params.id, { verified }, { new: true }).select(
    "-password",
  );
  if (!user) throw ApiError.notFound("User not found.");

  await createNotification(user.id, {
    type: "verification",
    title: verified ? "Account verified" : "Verification revoked",
    body: verified
      ? "Your Basai Finder account is now verified."
      : "Your account verification was removed. Contact support for details.",
  });

  res.json({ user });
}

export async function updateMe(req: Request, res: Response) {
  const user = req.user!;
  const { name, phone, address, tenantProfile, landlordProfile } = req.body;

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;
  if (tenantProfile) Object.assign(user.tenantProfile, tenantProfile);
  if (landlordProfile) Object.assign(user.landlordProfile, landlordProfile);

  await user.save();
  res.json({ user: toUserResponse(user) });
}

export async function updatePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user!.id).select("+passwordHash");
  if (!user || !(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest("Current password is incorrect.");
  }

  user.passwordHash = newPassword;
  await user.save();
  res.json({ message: "Password updated successfully." });
}

export async function uploadAvatar(req: Request, res: Response) {
  if (!req.file) throw ApiError.badRequest("No image file was uploaded.");

  const user = req.user!;
  user.avatarUrl = toPublicPath("avatars", req.file.filename);
  await user.save();

  res.json({ user: toUserResponse(user) });
}

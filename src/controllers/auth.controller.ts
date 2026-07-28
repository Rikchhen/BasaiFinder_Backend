import crypto from "crypto";
import { Request, Response } from "express";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { signToken, setAuthCookie, clearAuthCookie } from "../utils/jwt";
import { toUserResponse } from "../utils/serialize";

export async function register(req: Request, res: Response) {
  const { name, email, phone, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict("An account with this email already exists.");

  const user = await User.create({ name, email, phone, passwordHash: password, role });

  const token = signToken({ id: user.id, role: user.role });
  setAuthCookie(res, token);
  res.status(201).json({ user: toUserResponse(user) });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized("Incorrect email or password.");
  }

  const token = signToken({ id: user.id, role: user.role });
  setAuthCookie(res, token);
  res.json({ user: toUserResponse(user) });
}

export async function logout(_req: Request, res: Response) {
  clearAuthCookie(res);
  res.status(204).send();
}

export async function getMe(req: Request, res: Response) {
  res.json({ user: toUserResponse(req.user!) });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    console.log(`[password reset] link for ${email}: /reset-password/${rawToken}`);
  }

  res.json({ message: "If that email exists, a reset link has been sent." });
}

export async function resetPassword(req: Request, res: Response) {
  const token = String(req.params.token);
  const { password } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  }).select("+resetPasswordToken +resetPasswordExpires");

  if (!user) throw ApiError.badRequest("This reset link is invalid or has expired.");

  user.passwordHash = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: "Password has been reset. You can now log in." });
}

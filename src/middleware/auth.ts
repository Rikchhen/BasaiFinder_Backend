import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { verifyToken } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";
import { User, UserRole } from "../models/User";

export async function protect(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[env.cookieName];
    if (!token) throw ApiError.unauthorized("You must be logged in to do that.");

    const payload = verifyToken(token);
    const user = await User.findById(payload.id);
    if (!user) throw ApiError.unauthorized("This account no longer exists.");

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    next(ApiError.unauthorized("Invalid or expired session."));
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden("You don't have permission to do that."));
    }
    next();
  };
}

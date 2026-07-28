import jwt from "jsonwebtoken";
import { Response } from "express";
import { env } from "../config/env";

export interface JwtPayload {
  id: string;
  role: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(env.cookieName, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_MS,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(env.cookieName, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
  });
}

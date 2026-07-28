import { Request, Response, NextFunction } from "express";
import { Error as MongooseError } from "mongoose";
import { MulterError } from "multer";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message, details: err.details });
  }

  if (err instanceof MongooseError.CastError) {
    return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
  }

  if (err instanceof MongooseError.ValidationError) {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: "Validation failed.", details });
  }

  if (typeof err === "object" && err !== null && (err as { code?: number }).code === 11000) {
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue || {};
    const field = Object.keys(keyValue)[0] || "field";
    return res.status(409).json({ message: `${field} already in use.` });
  }

  if (err instanceof MulterError) {
    return res.status(400).json({ message: err.message });
  }

  if (err instanceof Error && (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError")) {
    return res.status(401).json({ message: "Invalid or expired session." });
  }

  console.error(err);
  const message = err instanceof Error ? err.message : "Something went wrong.";
  res.status(500).json({ message: env.isProduction ? "Internal server error." : message });
}

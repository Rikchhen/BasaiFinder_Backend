import fs from "fs";
import path from "path";
import multer, { FileFilterCallback } from "multer";
import { Request, Response, NextFunction } from "express";

const UPLOADS_ROOT = path.join(__dirname, "../../uploads");
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function makeStorage(subfolder: string) {
  const destination = path.join(UPLOADS_ROOT, subfolder);
  fs.mkdirSync(destination, { recursive: true });

  return multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, destination),
    filename: (_req, file, callback) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      callback(null, uniqueName);
    },
  });
}

function imageFileFilter(_req: Request, file: Express.Multer.File, callback: FileFilterCallback) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    callback(new Error("Only JPG, PNG, or WEBP images are allowed."));
    return;
  }
  callback(null, true);
}

export const uploadAvatar = multer({
  storage: makeStorage("avatars"),
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

export const uploadListingImages = multer({
  storage: makeStorage("listings"),
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 8 },
});

export function toPublicPath(subfolder: string, filename: string): string {
  return `/uploads/${subfolder}/${filename}`;
}

// multipart/form-data has no native nested-object support, so JSON-shaped
// fields (e.g. "location") arrive as plain strings that need parsing before
// they reach the zod validators.
export function parseMultipartJsonFields(...fields: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    for (const field of fields) {
      const value = req.body?.[field];
      if (typeof value === "string") {
        try {
          req.body[field] = JSON.parse(value);
        } catch {
          // leave as-is; downstream zod validation will reject the bad shape
        }
      }
    }
    next();
  };
}

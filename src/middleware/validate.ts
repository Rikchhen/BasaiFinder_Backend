import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";
import { ApiError } from "../utils/ApiError";

type Source = "body" | "query" | "params";

export function validate(schema: ZodType, source: Source = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return next(ApiError.badRequest("Validation failed.", details));
    }
    // Express 5's req.query is a read-only getter, so only req.body can be
    // safely overwritten with the parsed/coerced value; query validation is
    // shape-checking only and controllers re-read req.query themselves.
    if (source === "body") {
      req.body = result.data;
    }
    next();
  };
}

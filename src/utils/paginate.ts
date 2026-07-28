import { Request } from "express";

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function getPagination(req: Request, defaultLimit = 12, maxLimit = 50): PaginationParams {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(req.query.limit) || defaultLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function buildPaginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

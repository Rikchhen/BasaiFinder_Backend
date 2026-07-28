import { Request, Response } from "express";
import { Listing } from "../models/Listing";
import { ApiError } from "../utils/ApiError";
import { getPagination, buildPaginationMeta } from "../utils/paginate";
import { toPublicPath } from "../middleware/upload";

function buildFilter(query: Request["query"]) {
  const filter: Record<string, unknown> = { isActive: true };

  if (query.district) filter["location.district"] = query.district;
  if (query.neighborhood) filter["location.neighborhood"] = query.neighborhood;
  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;

  const minPrice = Number(query.minPrice);
  const maxPrice = Number(query.maxPrice);
  if (!Number.isNaN(minPrice) || !Number.isNaN(maxPrice)) {
    filter.price = {
      ...(query.minPrice ? { $gte: minPrice } : {}),
      ...(query.maxPrice ? { $lte: maxPrice } : {}),
    };
  }

  if (query.amenities) {
    const amenities = String(query.amenities).split(",").map((a) => a.trim());
    filter.amenities = { $all: amenities };
  }

  if (query.q) {
    filter.$text = { $search: String(query.q) };
  }

  return filter;
}

function buildSort(sortParam: unknown): Record<string, 1 | -1> {
  if (sortParam === "price_asc") return { price: 1 };
  if (sortParam === "price_desc") return { price: -1 };
  return { createdAt: -1 };
}

export async function listListings(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req);
  const filter = buildFilter(req.query);
  const sort = buildSort(req.query.sort);

  const [listings, total] = await Promise.all([
    Listing.find(filter).sort(sort).skip(skip).limit(limit).populate("landlord", "name phone avatarUrl"),
    Listing.countDocuments(filter),
  ]);

  res.json({ listings, meta: buildPaginationMeta(page, limit, total) });
}

export async function getMyListings(req: Request, res: Response) {
  const { page, limit, skip } = getPagination(req);
  const filter = { landlord: req.user!.id };

  const [listings, total] = await Promise.all([
    Listing.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Listing.countDocuments(filter),
  ]);

  res.json({ listings, meta: buildPaginationMeta(page, limit, total) });
}

export async function getListing(req: Request, res: Response) {
  const listing = await Listing.findByIdAndUpdate(
    req.params.id,
    { $inc: { viewsCount: 1 } },
    { new: true },
  ).populate("landlord", "name phone avatarUrl landlordProfile");

  if (!listing) throw ApiError.notFound("Listing not found.");
  res.json({ listing });
}

export async function createListing(req: Request, res: Response) {
  const files = (req.files as Express.Multer.File[] | undefined) || [];
  const images = files.map((file) => toPublicPath("listings", file.filename));

  const listing = await Listing.create({
    ...req.body,
    landlord: req.user!.id,
    images,
  });

  res.status(201).json({ listing });
}

async function findOwnedListing(id: string, user: Request["user"]) {
  const listing = await Listing.findById(id);
  if (!listing) throw ApiError.notFound("Listing not found.");
  if (listing.landlord.toString() !== user!.id && user!.role !== "admin") {
    throw ApiError.forbidden("You don't own this listing.");
  }
  return listing;
}

export async function updateListing(req: Request, res: Response) {
  const listing = await findOwnedListing(String(req.params.id), req.user);
  Object.assign(listing, req.body);
  await listing.save();
  res.json({ listing });
}

export async function deleteListing(req: Request, res: Response) {
  const listing = await findOwnedListing(String(req.params.id), req.user);
  await listing.deleteOne();
  res.status(204).send();
}

export async function addListingImages(req: Request, res: Response) {
  const listing = await findOwnedListing(String(req.params.id), req.user);
  const files = (req.files as Express.Multer.File[] | undefined) || [];
  if (!files.length) throw ApiError.badRequest("No image files were uploaded.");

  listing.images.push(...files.map((file) => toPublicPath("listings", file.filename)));
  await listing.save();
  res.json({ listing });
}

export async function updateListingStatus(req: Request, res: Response) {
  const listing = await Listing.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true },
  );
  if (!listing) throw ApiError.notFound("Listing not found.");
  res.json({ listing });
}

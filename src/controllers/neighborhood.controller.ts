import { Request, Response } from "express";
import { Neighborhood } from "../models/Neighborhood";
import { Listing } from "../models/Listing";
import { ApiError } from "../utils/ApiError";

export async function listNeighborhoods(_req: Request, res: Response) {
  const neighborhoods = await Neighborhood.find().sort({ name: 1 });

  const counts = await Listing.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: "$location.neighborhood", count: { $sum: 1 } } },
  ]);
  const countByName = new Map(counts.map((c) => [c._id, c.count]));

  res.json({
    neighborhoods: neighborhoods.map((n) => ({
      ...n.toObject(),
      activeListingsCount: countByName.get(n.name) || 0,
    })),
  });
}

export async function getNeighborhood(req: Request, res: Response) {
  const neighborhood = await Neighborhood.findOne({ name: req.params.name });
  if (!neighborhood) throw ApiError.notFound("Neighborhood not found.");
  res.json({ neighborhood });
}

export async function createNeighborhood(req: Request, res: Response) {
  const neighborhood = await Neighborhood.create(req.body);
  res.status(201).json({ neighborhood });
}

export async function updateNeighborhood(req: Request, res: Response) {
  const neighborhood = await Neighborhood.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!neighborhood) throw ApiError.notFound("Neighborhood not found.");
  res.json({ neighborhood });
}

export async function deleteNeighborhood(req: Request, res: Response) {
  const neighborhood = await Neighborhood.findByIdAndDelete(req.params.id);
  if (!neighborhood) throw ApiError.notFound("Neighborhood not found.");
  res.status(204).send();
}

import { Request, Response } from "express";
import { SavedRoom } from "../models/SavedRoom";
import { ApiError } from "../utils/ApiError";

export async function listSavedRooms(req: Request, res: Response) {
  const savedRooms = await SavedRoom.find({ user: req.user!.id })
    .sort({ createdAt: -1 })
    .populate("listing");

  res.json({ savedRooms });
}

export async function saveRoom(req: Request, res: Response) {
  try {
    const savedRoom = await SavedRoom.create({
      user: req.user!.id,
      listing: String(req.params.listingId),
    });
    res.status(201).json({ savedRoom });
  } catch (error) {
    if (typeof error === "object" && error !== null && (error as { code?: number }).code === 11000) {
      throw ApiError.conflict("This room is already saved.");
    }
    throw error;
  }
}

export async function unsaveRoom(req: Request, res: Response) {
  await SavedRoom.findOneAndDelete({ user: req.user!.id, listing: req.params.listingId });
  res.status(204).send();
}

import { Request, Response } from "express";
import { SavedSearch } from "../models/SavedSearch";
import { ApiError } from "../utils/ApiError";

export async function listSavedSearches(req: Request, res: Response) {
  const savedSearches = await SavedSearch.find({ user: req.user!.id }).sort({ createdAt: -1 });
  res.json({ savedSearches });
}

export async function createSavedSearch(req: Request, res: Response) {
  const savedSearch = await SavedSearch.create({ ...req.body, user: req.user!.id });
  res.status(201).json({ savedSearch });
}

async function findOwnedSavedSearch(id: string, userId: string) {
  const savedSearch = await SavedSearch.findOne({ _id: id, user: userId });
  if (!savedSearch) throw ApiError.notFound("Saved search not found.");
  return savedSearch;
}

export async function updateSavedSearch(req: Request, res: Response) {
  const savedSearch = await findOwnedSavedSearch(String(req.params.id), req.user!.id);
  Object.assign(savedSearch, req.body);
  await savedSearch.save();
  res.json({ savedSearch });
}

export async function deleteSavedSearch(req: Request, res: Response) {
  const savedSearch = await findOwnedSavedSearch(String(req.params.id), req.user!.id);
  await savedSearch.deleteOne();
  res.status(204).send();
}

import { Router } from "express";
import * as listingController from "../controllers/listing.controller";
import { protect, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { uploadListingImages, parseMultipartJsonFields } from "../middleware/upload";
import {
  createListingSchema,
  updateListingSchema,
  updateListingStatusSchema,
} from "../validators/listing.validators";

const router = Router();

router.get("/", listingController.listListings);
router.get("/mine", protect, authorize("landlord", "admin"), listingController.getMyListings);
router.get("/:id", listingController.getListing);

router.post(
  "/",
  protect,
  authorize("landlord", "admin"),
  uploadListingImages.array("images", 8),
  parseMultipartJsonFields("location", "amenities"),
  validate(createListingSchema),
  listingController.createListing,
);

router.patch(
  "/:id",
  protect,
  authorize("landlord", "admin"),
  validate(updateListingSchema),
  listingController.updateListing,
);

router.delete("/:id", protect, authorize("landlord", "admin"), listingController.deleteListing);

router.post(
  "/:id/images",
  protect,
  authorize("landlord", "admin"),
  uploadListingImages.array("images", 8),
  listingController.addListingImages,
);

router.patch(
  "/:id/status",
  protect,
  authorize("admin"),
  validate(updateListingStatusSchema),
  listingController.updateListingStatus,
);

export default router;

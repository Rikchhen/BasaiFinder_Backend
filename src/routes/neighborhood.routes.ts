import { Router } from "express";
import * as neighborhoodController from "../controllers/neighborhood.controller";
import { protect, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  neighborhoodSchema,
  updateNeighborhoodSchema,
} from "../validators/neighborhood.validators";

const router = Router();

router.get("/", neighborhoodController.listNeighborhoods);
router.get("/:name", neighborhoodController.getNeighborhood);

router.post(
  "/",
  protect,
  authorize("admin"),
  validate(neighborhoodSchema),
  neighborhoodController.createNeighborhood,
);
router.patch(
  "/:id",
  protect,
  authorize("admin"),
  validate(updateNeighborhoodSchema),
  neighborhoodController.updateNeighborhood,
);
router.delete("/:id", protect, authorize("admin"), neighborhoodController.deleteNeighborhood);

export default router;

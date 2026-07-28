import { Router } from "express";
import * as savedSearchController from "../controllers/savedSearch.controller";
import { protect } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createSavedSearchSchema,
  updateSavedSearchSchema,
} from "../validators/savedSearch.validators";

const router = Router();

router.use(protect);

router.get("/", savedSearchController.listSavedSearches);
router.post("/", validate(createSavedSearchSchema), savedSearchController.createSavedSearch);
router.patch(
  "/:id",
  validate(updateSavedSearchSchema),
  savedSearchController.updateSavedSearch,
);
router.delete("/:id", savedSearchController.deleteSavedSearch);

export default router;

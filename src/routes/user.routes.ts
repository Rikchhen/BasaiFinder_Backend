import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { protect, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { uploadAvatar } from "../middleware/upload";
import { updateMeSchema, updatePasswordSchema } from "../validators/user.validators";

const router = Router();

router.use(protect);

router.get("/me", userController.getMe);
router.patch("/me", validate(updateMeSchema), userController.updateMe);
router.patch("/me/password", validate(updatePasswordSchema), userController.updatePassword);
router.post("/me/avatar", uploadAvatar.single("avatar"), userController.uploadAvatar);

// Admin moderation.
router.get("/", authorize("admin"), userController.listUsers);
router.patch("/:id/verify", authorize("admin"), userController.setUserVerified);

export default router;

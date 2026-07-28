import { Router } from "express";
import * as bookingController from "../controllers/booking.controller";
import { protect, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createBookingSchema, updateBookingStatusSchema } from "../validators/booking.validators";

const router = Router();

router.use(protect);

router.post("/", authorize("tenant"), validate(createBookingSchema), bookingController.createBooking);
router.get("/mine", bookingController.getMyBookings);
router.get("/:id", bookingController.getBooking);
router.patch(
  "/:id/status",
  validate(updateBookingStatusSchema),
  bookingController.updateBookingStatus,
);

export default router;

import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import listingRoutes from "./listing.routes";
import neighborhoodRoutes from "./neighborhood.routes";
import savedRoomRoutes from "./savedRoom.routes";
import savedSearchRoutes from "./savedSearch.routes";
import bookingRoutes from "./booking.routes";
import conversationRoutes from "./conversation.routes";
import notificationRoutes from "./notification.routes";
import dashboardRoutes from "./dashboard.routes";

const router = Router();

router.get("/health", (_req, res) => res.json({ status: "ok" }));

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/listings", listingRoutes);
router.use("/neighborhoods", neighborhoodRoutes);
router.use("/saved-rooms", savedRoomRoutes);
router.use("/saved-searches", savedSearchRoutes);
router.use("/bookings", bookingRoutes);
router.use("/conversations", conversationRoutes);
router.use("/notifications", notificationRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;

import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller";
import { protect, authorize } from "../middleware/auth";

const router = Router();

router.use(protect);

router.get("/tenant", authorize("tenant", "admin"), dashboardController.getTenantDashboard);
router.get("/landlord", authorize("landlord", "admin"), dashboardController.getLandlordDashboard);

export default router;

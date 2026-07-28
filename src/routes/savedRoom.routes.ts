import { Router } from "express";
import * as savedRoomController from "../controllers/savedRoom.controller";
import { protect } from "../middleware/auth";

const router = Router();

router.use(protect);

router.get("/", savedRoomController.listSavedRooms);
router.post("/:listingId", savedRoomController.saveRoom);
router.delete("/:listingId", savedRoomController.unsaveRoom);

export default router;

import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../controllers/notification/notificationController";

const router = Router();

router.use(protect);

router.get("/", getMyNotifications);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);
router.delete("/", clearAllNotifications);

export default router;

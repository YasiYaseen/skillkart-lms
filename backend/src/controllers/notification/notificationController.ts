import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import Notification from "../../models/Notification";

/**
 * GET /api/notifications
 * Get all notifications for the current user
 */
export async function getMyNotifications(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({ recipient: req.user.id, read: false });

    return res.json({ notifications, unreadCount });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
export async function markAsRead(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.json({ notification });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read for the current user
 */
export async function markAllAsRead(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );

    return res.json({ message: "All notifications marked as read" });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * DELETE /api/notifications/:id
 * Delete a single notification
 */
export async function deleteNotification(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.json({ message: "Notification deleted" });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

/**
 * DELETE /api/notifications
 * Clear all notifications for the current user
 */
export async function clearAllNotifications(req: Request, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    await Notification.deleteMany({ recipient: req.user.id });

    return res.json({ message: "All notifications cleared" });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

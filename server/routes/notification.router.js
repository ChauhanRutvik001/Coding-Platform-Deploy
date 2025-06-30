/**
 * NOTIFICATION MANAGEMENT ROUTES
 *
 * This file contains all routes for managing user notifications in the online platform.
 * Routes handle notification retrieval, marking as read, and deletion.
 *
 * MIDDLEWARE:
 * - isAuthorized: Required for all routes (user must be logged in)
 */

import express from "express";
import { isAuthorized } from "../middlewares/auth.js";

const router = express.Router();

// Mock data for notifications since we don't have a real implementation yet
const mockNotifications = [];

// Get all notifications for the current user
router.get("/", isAuthorized, async (req, res) => {
  try {
    // In a real implementation, you would fetch from the database
    // const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });

    // For now, return mock data
    const userNotifications = mockNotifications.filter((n) => n.userId === req.user.id);
    const unreadCount = userNotifications.filter((n) => !n.read).length;

    res.status(200).json({
      success: true,
      data: {
        notifications: userNotifications,
        unreadCount,
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
});

// Mark a notification as read
router.patch("/:id/read", isAuthorized, async (req, res) => {
  try {
    const { id } = req.params;

    // In a real implementation, you would update the database
    // await Notification.findOneAndUpdate(
    //   { _id: id, userId: req.user.id },
    //   { read: true }
    // );

    // For mock data
    const notification = mockNotifications.find((n) => n.id === id && n.userId === req.user.id);
    if (notification) {
      notification.read = true;
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    });
  }
});

// Mark all notifications as read
router.patch("/mark-all-read", isAuthorized, async (req, res) => {
  try {
    // In a real implementation, you would update the database
    // await Notification.updateMany(
    //   { userId: req.user.id, read: false },
    //   { read: true }
    // );

    // For mock data
    mockNotifications.forEach((notification) => {
      if (notification.userId === req.user.id) {
        notification.read = true;
      }
    });

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
    });
  }
});

// Delete a notification
router.delete("/:id", isAuthorized, async (req, res) => {
  try {
    const { id } = req.params;

    // In a real implementation, you would delete from the database
    // await Notification.findOneAndDelete({ _id: id, userId: req.user.id });

    // For mock data
    const index = mockNotifications.findIndex((n) => n.id === id && n.userId === req.user.id);
    if (index !== -1) {
      mockNotifications.splice(index, 1);
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
});

export default router;

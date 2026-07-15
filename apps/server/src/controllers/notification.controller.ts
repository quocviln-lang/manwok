import type { Response } from "express";
import prisma from "../prisma/prisma.js";
import { sendResponse } from "../utils/response.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

export const getNotifications = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return sendResponse(res, 200, true, "Notifications fetched successfully", { notifications });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) return sendResponse(res, 404, false, "Notification not found");
    if (notification.userId !== userId) return sendResponse(res, 403, false, "Not your notification");

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return sendResponse(res, 200, true, "Notification marked as read", { notification: updatedNotification });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return sendResponse(res, 200, true, "All notifications marked as read");
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

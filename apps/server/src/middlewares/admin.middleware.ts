import type { Response, NextFunction } from "express";
import { sendResponse } from "../utils/response.js";
import type { AuthRequest } from "./auth.middleware.js";
import prisma from "../prisma/prisma.js";

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  if (!req.user) {
    return sendResponse(res, 401, false, "Not authenticated");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { systemRole: true }
    });

    if (!user || user.systemRole !== "SYSTEM_ADMIN") {
      return sendResponse(res, 403, false, "Not authorized as admin");
    }

    next();
  } catch (error: any) {
    return sendResponse(res, 500, false, "Server Error");
  }
};

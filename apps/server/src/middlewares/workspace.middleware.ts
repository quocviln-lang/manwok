import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./auth.middleware.js";
import { sendResponse } from "../utils/response.js";
import prisma from "../prisma/prisma.js";

// Valid roles in Prisma schema: 'OWNER', 'ADMIN', 'MEMBER'
export const requireWorkspaceRole = (allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
      if (!req.user) {
        return sendResponse(res, 401, false, "Not authenticated");
      }

      const workspaceId = req.params.id; // Route must provide :id parameter
      if (!workspaceId) {
        return sendResponse(res, 400, false, "Workspace ID is required");
      }

      const membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: req.user.id,
          },
        },
      });

      if (!membership) {
        return sendResponse(res, 403, false, "You are not a member of this workspace");
      }

      if (!allowedRoles.includes(membership.role)) {
        return sendResponse(res, 403, false, `Access denied. Requires role: ${allowedRoles.join(" or ")}`);
      }

      next();
    } catch (error: any) {
      return sendResponse(res, 500, false, "Server Error checking workspace role");
    }
  };
};

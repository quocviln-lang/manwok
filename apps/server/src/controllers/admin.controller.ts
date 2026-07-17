import type { Request, Response } from "express";
import { z } from "zod";
import prisma from "../prisma/prisma.js";
import { sendResponse } from "../utils/response.js";

export const getStats = async (req: Request, res: Response): Promise<any> => {
  try {
    const totalUsers = await prisma.user.count();
    const totalWorkspaces = await prisma.workspace.count();
    const totalBoards = await prisma.board.count();
    const totalCards = await prisma.card.count();

    // Chart data for user growth (last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const usersData = await prisma.user.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true }
    });

    const chartDataMap: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0] as string;
      chartDataMap[dateStr] = 0;
    }

    usersData.forEach(user => {
      const dateStr = user.createdAt.toISOString().split('T')[0] as string;
      if (chartDataMap[dateStr] !== undefined) {
        chartDataMap[dateStr]++;
      }
    });

    const userGrowthChart = Object.keys(chartDataMap).map(date => ({
      date,
      users: chartDataMap[date],
    }));

    return sendResponse(res, 200, true, "Admin stats fetched", {
      stats: { totalUsers, totalWorkspaces, totalBoards, totalCards },
      userGrowthChart
    });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const getUsers = async (req: Request, res: Response): Promise<any> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        systemRole: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return sendResponse(res, 200, true, "Users fetched", { users });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

const updateRoleSchema = z.object({
  role: z.enum(["SYSTEM_USER", "SYSTEM_ADMIN"]),
});

export const updateUserRole = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const parsedData = updateRoleSchema.safeParse(req.body);
    if (!parsedData.success) {
      return sendResponse(res, 400, false, "Invalid input", parsedData.error.issues);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { systemRole: parsedData.data.role },
      select: { id: true, email: true, systemRole: true }
    });

    return sendResponse(res, 200, true, "User role updated", { user: updatedUser });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

export const toggleUserStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const parsedData = updateStatusSchema.safeParse(req.body);
    if (!parsedData.success) {
      return sendResponse(res, 400, false, "Invalid input", parsedData.error.issues);
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return sendResponse(res, 404, false, "User not found");

    if (user.id === (req as any).user?.id) {
      return sendResponse(res, 400, false, "Cannot lock your own account");
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: parsedData.data.isActive },
      select: { id: true, email: true, isActive: true }
    });

    return sendResponse(res, 200, true, "User status updated", { user: updatedUser });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return sendResponse(res, 404, false, "User not found");

    // Prevent deleting oneself
    if (user.id === (req as any).user?.id) {
      return sendResponse(res, 400, false, "Cannot delete yourself");
    }

    await prisma.user.delete({ where: { id } });
    return sendResponse(res, 200, true, "User deleted successfully");
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const getWorkspaces = async (req: Request, res: Response): Promise<any> => {
  try {
    const workspaces = await prisma.workspace.findMany({
      include: {
        owner: { select: { fullName: true, email: true } },
        _count: { select: { members: true, boards: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return sendResponse(res, 200, true, "Workspaces fetched", { workspaces });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const deleteWorkspace = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    
    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) return sendResponse(res, 404, false, "Workspace not found");

    await prisma.workspace.delete({ where: { id } });
    return sendResponse(res, 200, true, "Workspace deleted successfully");
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

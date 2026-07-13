import type { Response } from "express";
import { z } from "zod";
import prisma from "../prisma/prisma.js";
import { sendResponse } from "../utils/response.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(100),
  description: z.string().optional(),
});

export const createWorkspace = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const parsedData = createWorkspaceSchema.safeParse(req.body);
    if (!parsedData.success) {
      return sendResponse(res, 400, false, "Invalid input data", parsedData.error.issues);
    }

    const { name, description } = parsedData.data;
    const userId = req.user!.id;

    // Check limit (Max 10 workspaces created by user)
    const workspaceCount = await prisma.workspace.count({
      where: { ownerId: userId },
    });

    if (workspaceCount >= 10) {
      return sendResponse(res, 403, false, "You have reached the maximum limit of 10 workspaces.");
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        description: description ?? null,
        ownerId: userId,
        members: {
          create: {
            userId: userId,
            role: "OWNER",
          },
        },
      },
    });

    return sendResponse(res, 201, true, "Workspace created successfully", { workspace });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const getWorkspaces = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        owner: {
          select: { id: true, fullName: true, email: true, avatar: true },
        },
        _count: {
          select: { members: true, boards: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return sendResponse(res, 200, true, "Workspaces fetched successfully", { workspaces });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const getWorkspaceById = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    // Extra security: even though middleware runs for update/delete,
    // getWorkspaceById might just use standard protect. We must ensure user is a member.
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: id, userId } },
    });

    if (!membership) {
      return sendResponse(res, 403, false, "You are not a member of this workspace");
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, avatar: true },
            },
          },
        },
        boards: true,
      },
    });

    if (!workspace) {
      return sendResponse(res, 404, false, "Workspace not found");
    }

    return sendResponse(res, 200, true, "Workspace fetched successfully", { workspace });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
});

export const updateWorkspace = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const parsedData = updateWorkspaceSchema.safeParse(req.body);

    if (!parsedData.success) {
      return sendResponse(res, 400, false, "Invalid input data", parsedData.error.issues);
    }

    // Filter out undefined properties because Prisma's exactOptionalPropertyTypes is strict
    const dataToUpdate: any = {};
    if (parsedData.data.name !== undefined) dataToUpdate.name = parsedData.data.name;
    if (parsedData.data.description !== undefined) dataToUpdate.description = parsedData.data.description;

    const updatedWorkspace = await prisma.workspace.update({
      where: { id },
      data: dataToUpdate,
    });

    return sendResponse(res, 200, true, "Workspace updated successfully", { workspace: updatedWorkspace });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const deleteWorkspace = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;

    await prisma.workspace.delete({
      where: { id },
    });

    return sendResponse(res, 200, true, "Workspace deleted successfully");
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

import type { Response } from "express";
import { z } from "zod";
import prisma from "../prisma/prisma.js";
import { sendResponse } from "../utils/response.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

const createBoardSchema = z.object({
  title: z.string().min(1, "Board title is required").max(100),
  description: z.string().optional(),
  cover: z.string().optional(),
  visibility: z.enum(["PRIVATE", "WORKSPACE", "PUBLIC"]).optional(),
});

export const createBoard = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const userId = req.user!.id;

    // Check workspace membership
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    if (!membership) {
      return sendResponse(res, 403, false, "You are not a member of this workspace");
    }

    const parsedData = createBoardSchema.safeParse(req.body);
    if (!parsedData.success) {
      return sendResponse(res, 400, false, "Invalid input data", parsedData.error.issues);
    }

    const { title, description, cover, visibility } = parsedData.data;

    const board = await prisma.board.create({
      data: {
        title,
        description: description ?? null,
        cover: cover ?? null,
        visibility: visibility ?? "WORKSPACE",
        workspaceId,
      },
    });

    return sendResponse(res, 201, true, "Board created successfully", { board });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const getWorkspaceBoards = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const userId = req.user!.id;

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    if (!membership) {
      return sendResponse(res, 403, false, "You are not a member of this workspace");
    }

    const boards = await prisma.board.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });

    return sendResponse(res, 200, true, "Boards fetched successfully", { boards });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const getBoardById = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        lists: {
          where: { archived: false },
          orderBy: { position: "asc" },
          include: {
            cards: {
              where: { archived: false },
              orderBy: { position: "asc" },
            }
          }
        },
      },
    });

    if (!board) {
      return sendResponse(res, 404, false, "Board not found");
    }

    // Check if user has access to the board's workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: board.workspaceId, userId } },
    });

    if (!membership && board.visibility !== "PUBLIC") {
      return sendResponse(res, 403, false, "You do not have access to this board");
    }

    return sendResponse(res, 200, true, "Board fetched successfully", { board });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

const updateBoardSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  cover: z.string().optional(),
  visibility: z.enum(["PRIVATE", "WORKSPACE", "PUBLIC"]).optional(),
});

export const updateBoard = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const board = await prisma.board.findUnique({ where: { id } });
    if (!board) return sendResponse(res, 404, false, "Board not found");

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: board.workspaceId, userId } },
    });

    if (!membership) {
      return sendResponse(res, 403, false, "You are not a member of this workspace");
    }

    const parsedData = updateBoardSchema.safeParse(req.body);
    if (!parsedData.success) {
      return sendResponse(res, 400, false, "Invalid input data", parsedData.error.issues);
    }

    const dataToUpdate: any = {};
    if (parsedData.data.title !== undefined) dataToUpdate.title = parsedData.data.title;
    if (parsedData.data.description !== undefined) dataToUpdate.description = parsedData.data.description;
    if (parsedData.data.cover !== undefined) dataToUpdate.cover = parsedData.data.cover;
    if (parsedData.data.visibility !== undefined) dataToUpdate.visibility = parsedData.data.visibility;

    const updatedBoard = await prisma.board.update({
      where: { id },
      data: dataToUpdate,
    });

    return sendResponse(res, 200, true, "Board updated successfully", { board: updatedBoard });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const deleteBoard = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const board = await prisma.board.findUnique({ where: { id } });
    if (!board) return sendResponse(res, 404, false, "Board not found");

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: board.workspaceId, userId } },
    });

    // Only OWNER or ADMIN can delete a board
    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      return sendResponse(res, 403, false, "You don't have permission to delete this board");
    }

    await prisma.board.delete({ where: { id } });

    return sendResponse(res, 200, true, "Board deleted successfully");
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

import type { Response } from "express";
import { z } from "zod";
import prisma from "../prisma/prisma.js";
import { sendResponse } from "../utils/response.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

const createListSchema = z.object({
  title: z.string().min(1, "List title is required").max(100),
  position: z.number().optional(), // If not provided, we calculate the max position
});

export const createList = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const boardId = req.params.boardId as string;
    const userId = req.user!.id;

    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) return sendResponse(res, 404, false, "Board not found");

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: board.workspaceId, userId } },
    });

    if (!membership) {
      return sendResponse(res, 403, false, "You do not have access to this board");
    }

    const parsedData = createListSchema.safeParse(req.body);
    if (!parsedData.success) {
      return sendResponse(res, 400, false, "Invalid input data", parsedData.error.issues);
    }

    let { title, position } = parsedData.data;

    if (position === undefined) {
      // Find the max position currently in the board
      const lastList = await prisma.list.findFirst({
        where: { boardId },
        orderBy: { position: "desc" },
      });
      // Increment by 65535 (typical float increment used by Trello/Jira for easy reordering)
      position = lastList ? lastList.position + 65535 : 65535;
    }

    const list = await prisma.list.create({
      data: {
        title,
        position,
        boardId,
      },
    });

    return sendResponse(res, 201, true, "List created successfully", { list });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

const updateListSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  archived: z.boolean().optional(),
});

export const updateList = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const list = await prisma.list.findUnique({
      where: { id },
      include: { board: true },
    });

    if (!list) return sendResponse(res, 404, false, "List not found");

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: list.board.workspaceId, userId } },
    });

    if (!membership) {
      return sendResponse(res, 403, false, "You do not have access to this list");
    }

    const parsedData = updateListSchema.safeParse(req.body);
    if (!parsedData.success) {
      return sendResponse(res, 400, false, "Invalid input data", parsedData.error.issues);
    }

    const dataToUpdate: any = {};
    if (parsedData.data.title !== undefined) dataToUpdate.title = parsedData.data.title;
    if (parsedData.data.archived !== undefined) dataToUpdate.archived = parsedData.data.archived;

    const updatedList = await prisma.list.update({
      where: { id },
      data: dataToUpdate,
    });

    return sendResponse(res, 200, true, "List updated successfully", { list: updatedList });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

const reorderListSchema = z.object({
  position: z.number({ required_error: "Position is required for reordering" }),
});

export const reorderList = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const list = await prisma.list.findUnique({
      where: { id },
      include: { board: true },
    });

    if (!list) return sendResponse(res, 404, false, "List not found");

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: list.board.workspaceId, userId } },
    });

    if (!membership) {
      return sendResponse(res, 403, false, "You do not have access to this list");
    }

    const parsedData = reorderListSchema.safeParse(req.body);
    if (!parsedData.success) {
      return sendResponse(res, 400, false, "Invalid input data", parsedData.error.issues);
    }

    const updatedList = await prisma.list.update({
      where: { id },
      data: { position: parsedData.data.position },
    });

    return sendResponse(res, 200, true, "List reordered successfully", { list: updatedList });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const deleteList = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const list = await prisma.list.findUnique({
      where: { id },
      include: { board: true },
    });

    if (!list) return sendResponse(res, 404, false, "List not found");

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: list.board.workspaceId, userId } },
    });

    if (!membership) {
      return sendResponse(res, 403, false, "You do not have permission to delete this list");
    }

    // Logic: User wants to archive it, not hard delete.
    const archivedList = await prisma.list.update({
      where: { id },
      data: { archived: true },
    });

    return sendResponse(res, 200, true, "List archived successfully", { list: archivedList });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

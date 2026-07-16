import type { Response } from "express";
import { z } from "zod";
import prisma from "../prisma/prisma.js";
import { sendResponse } from "../utils/response.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { logActivity } from "../utils/activity.js";
import { getIO } from "../socket.js";

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

    if (membership.role === "MEMBER") {
      return sendResponse(res, 403, false, "You do not have permission to create lists");
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

    await logActivity({
      boardId,
      userId,
      action: "CREATE_LIST",
      entityType: "LIST",
      entityId: list.id,
      entityTitle: list.title
    });

    getIO().to(`board_${boardId}`).emit("board:updated");

    return sendResponse(res, 201, true, "List created successfully", { list });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

const updateListSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  color: z.string().nullable().optional(),
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
    if (parsedData.data.color !== undefined) dataToUpdate.color = parsedData.data.color;
    if (parsedData.data.archived !== undefined) dataToUpdate.archived = parsedData.data.archived;

    const updatedList = await prisma.list.update({
      where: { id },
      data: dataToUpdate,
    });

    if (parsedData.data.archived !== undefined && parsedData.data.archived !== list.archived) {
      await logActivity({
        boardId: list.boardId,
        userId,
        action: parsedData.data.archived ? "ARCHIVE_LIST" : "RESTORE_LIST",
        entityType: "LIST",
        entityId: list.id,
        entityTitle: list.title
      });
    }

    getIO().to(`board_${list.boardId}`).emit("board:updated");
    
    return sendResponse(res, 200, true, "List updated successfully", { list: updatedList });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

const reorderListSchema = z.object({
  position: z.number(),
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

    getIO().to(`board_${list.boardId}`).emit("board:updated");
    
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

    if (membership.role === "MEMBER") {
      return sendResponse(res, 403, false, "You do not have permission to delete lists");
    }

    // Logic: User wants to archive it, not hard delete.
    const archivedList = await prisma.list.update({
      where: { id },
      data: { archived: true },
    });

    getIO().to(`board_${list.boardId}`).emit("board:updated");
    
    return sendResponse(res, 200, true, "List archived successfully", { list: archivedList });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const copyList = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const originalList = await prisma.list.findUnique({
      where: { id },
      include: {
        board: true,
        cards: {
          where: { archived: false },
          include: {
            checklists: { include: { items: true } },
            attachments: true
          }
        }
      },
    });

    if (!originalList) return sendResponse(res, 404, false, "List not found");

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: originalList.board.workspaceId, userId } },
    });

    if (!membership) return sendResponse(res, 403, false, "You don't have access to this list");

    if (membership.role === "MEMBER") {
      return sendResponse(res, 403, false, "You do not have permission to copy lists");
    }

    const newList = await prisma.list.create({
      data: {
        title: `${originalList.title} (Bản sao)`,
        color: originalList.color,
        position: originalList.position + 1, // Just place it slightly to the right
        boardId: originalList.boardId,
        cards: {
          create: originalList.cards.map(card => ({
            title: card.title,
            description: card.description,
            cover: card.cover,
            position: card.position,
            createdById: userId,
            startDate: card.startDate,
            dueDate: card.dueDate,
            isCompleted: card.isCompleted,
            checklists: {
              create: card.checklists.map(cl => ({
                title: cl.title,
                position: cl.position,
                items: {
                  create: cl.items.map(item => ({
                    content: item.content,
                    isCompleted: item.isCompleted,
                    position: item.position
                  }))
                }
              }))
            },
            attachments: {
              create: card.attachments.map(att => ({
                url: att.url,
                name: att.name,
                type: att.type
              }))
            }
          }))
        }
      }
    });

    getIO().to(`board_${originalList.boardId}`).emit("board:updated");
    
    return sendResponse(res, 201, true, "List copied successfully", { list: newList });
  } catch (error: any) {
    console.error("Copy List Error:", error);
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

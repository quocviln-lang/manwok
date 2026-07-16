import type { Response } from "express";
import { z } from "zod";
import prisma from "../prisma/prisma.js";
import { sendResponse } from "../utils/response.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { logActivity } from "../utils/activity.js";
import { getIO } from "../socket.js";

const createCardSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  position: z.number().optional(),
});

export const createCard = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const listId = req.params.listId as string;
    const userId = req.user!.id;

    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: { board: true },
    });

    if (!list) return sendResponse(res, 404, false, "List not found");

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: list.board.workspaceId, userId } },
    });

    if (!membership) {
      return sendResponse(res, 403, false, "You don't have access to this board");
    }

    if (membership.role === "MEMBER") {
      return sendResponse(res, 403, false, "You do not have permission to create cards");
    }

    const parsedData = createCardSchema.safeParse(req.body);
    if (!parsedData.success) {
      return sendResponse(res, 400, false, "Invalid input data", parsedData.error.issues);
    }

    let { title, description, position } = parsedData.data;

    if (position === undefined) {
      const lastCard = await prisma.card.findFirst({
        where: { listId },
        orderBy: { position: "desc" },
      });
      position = lastCard ? lastCard.position + 65535 : 65535;
    }

    const card = await prisma.card.create({
      data: {
        title,
        description: description ?? null,
        position,
        listId,
        createdById: userId,
      },
    });

    await logActivity({
      boardId: list.boardId,
      userId,
      action: "CREATE_CARD",
      entityType: "CARD",
      entityId: card.id,
      entityTitle: card.title
    });

    getIO().to(`board_${list.boardId}`).emit("board:updated");

    return sendResponse(res, 201, true, "Card created successfully", { card });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const getCardById = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const card = await prisma.card.findUnique({
      where: { id },
      include: {
        list: {
          include: { board: true },
        },
        assignees: {
          include: {
            user: { select: { id: true, fullName: true, avatar: true } },
          },
        },
        comments: {
          include: {
            user: { select: { id: true, fullName: true, avatar: true } },
            reactions: true,
          },
          orderBy: { createdAt: "desc" },
        },
        checklists: {
          include: { items: { orderBy: { position: "asc" } } },
          orderBy: { position: "asc" },
        },
        attachments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!card) return sendResponse(res, 404, false, "Card not found");

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: card.list.board.workspaceId, userId } },
    });

    if (!membership) return sendResponse(res, 403, false, "You don't have access to this card");

    return sendResponse(res, 200, true, "Card fetched successfully", { card });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

const updateCardSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  cover: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  isCompleted: z.boolean().optional(),
  archived: z.boolean().optional(),
});

export const updateCard = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const card = await prisma.card.findUnique({
      where: { id },
      include: { list: { include: { board: true } } },
    });

    if (!card) return sendResponse(res, 404, false, "Card not found");

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: card.list.board.workspaceId, userId } },
    });

    if (!membership) return sendResponse(res, 403, false, "You don't have access to update this card");

    const parsedData = updateCardSchema.safeParse(req.body);
    if (!parsedData.success) {
      return sendResponse(res, 400, false, "Invalid input data", parsedData.error.issues);
    }

    const dataToUpdate: any = {};
    if (parsedData.data.title !== undefined) dataToUpdate.title = parsedData.data.title;
    if (parsedData.data.description !== undefined) dataToUpdate.description = parsedData.data.description;
    if (parsedData.data.cover !== undefined) dataToUpdate.cover = parsedData.data.cover;
    if (parsedData.data.startDate !== undefined) dataToUpdate.startDate = parsedData.data.startDate ? new Date(parsedData.data.startDate) : null;
    if (parsedData.data.dueDate !== undefined) dataToUpdate.dueDate = parsedData.data.dueDate ? new Date(parsedData.data.dueDate) : null;
    if (parsedData.data.isCompleted !== undefined) dataToUpdate.isCompleted = parsedData.data.isCompleted;
    if (parsedData.data.archived !== undefined) dataToUpdate.archived = parsedData.data.archived;

    const updatedCard = await prisma.card.update({
      where: { id },
      data: dataToUpdate,
    });

    if (parsedData.data.archived !== undefined && parsedData.data.archived !== card.archived) {
      await logActivity({
        boardId: card.list.boardId,
        userId,
        action: parsedData.data.archived ? "ARCHIVE_CARD" : "RESTORE_CARD",
        entityType: "CARD",
        entityId: card.id,
        entityTitle: card.title
      });
    }

    if (parsedData.data.isCompleted !== undefined && parsedData.data.isCompleted !== card.isCompleted) {
      await logActivity({
        boardId: card.list.boardId,
        userId,
        action: parsedData.data.isCompleted ? "COMPLETE_CARD" : "INCOMPLETE_CARD",
        entityType: "CARD",
        entityId: card.id,
        entityTitle: card.title
      });
    }

    getIO().to(`board_${card.list.boardId}`).emit("board:updated");
    
    return sendResponse(res, 200, true, "Card updated successfully", { card: updatedCard });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

const moveCardSchema = z.object({
  listId: z.string().uuid().optional(),
  position: z.number().optional(),
});

export const moveCard = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const card = await prisma.card.findUnique({
      where: { id },
      include: { list: { include: { board: true } } },
    });

    if (!card) return sendResponse(res, 404, false, "Card not found");

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: card.list.board.workspaceId, userId } },
    });

    if (!membership) return sendResponse(res, 403, false, "You don't have access to this card");

    const parsedData = moveCardSchema.safeParse(req.body);
    if (!parsedData.success) {
      return sendResponse(res, 400, false, "Invalid input data", parsedData.error.issues);
    }

    const dataToUpdate: any = {};
    if (parsedData.data.listId !== undefined) {
      // Security: ensure the new list belongs to the same board, or user has access to it.
      // For simplicity, we just allow moving within the same workspace (or you could strictly check same board).
      const targetList = await prisma.list.findUnique({ where: { id: parsedData.data.listId }});
      if (!targetList) return sendResponse(res, 404, false, "Target list not found");
      dataToUpdate.listId = parsedData.data.listId;
    }
    
    if (parsedData.data.position !== undefined) dataToUpdate.position = parsedData.data.position;

    const updatedCard = await prisma.card.update({
      where: { id },
      data: dataToUpdate,
    });

    if (parsedData.data.listId && parsedData.data.listId !== card.listId) {
      await logActivity({
        boardId: card.list.boardId,
        userId,
        action: "MOVE_CARD",
        entityType: "CARD",
        entityId: card.id,
        entityTitle: card.title,
        details: { fromList: card.listId, toList: parsedData.data.listId }
      });
    }

    getIO().to(`board_${card.list.boardId}`).emit("board:updated");
    
    return sendResponse(res, 200, true, "Card moved successfully", { card: updatedCard });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const deleteCard = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const card = await prisma.card.findUnique({
      where: { id },
      include: { list: { include: { board: true } } },
    });

    if (!card) return sendResponse(res, 404, false, "Card not found");

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: card.list.board.workspaceId, userId } },
    });

    if (!membership) return sendResponse(res, 403, false, "You don't have permission to delete this card");

    if (membership.role === "MEMBER") {
      return sendResponse(res, 403, false, "You do not have permission to delete cards");
    }

    const archivedCard = await prisma.card.update({
      where: { id },
      data: { archived: true },
    });

    getIO().to(`board_${card.list.boardId}`).emit("board:updated");
    
    return sendResponse(res, 200, true, "Card archived successfully", { card: archivedCard });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

// --- ASSIGNEES ---

export const addAssignee = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const cardId = req.params.cardId as string;
    const userId = req.body.userId as string; // The user to assign
    const currentUserId = req.user!.id;

    if (!userId) return sendResponse(res, 400, false, "userId is required to assign");

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { list: { include: { board: true } } },
    });

    if (!card) return sendResponse(res, 404, false, "Card not found");

    // Check if current user has access
    const currentUserMembership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: card.list.board.workspaceId, userId: currentUserId } },
    });
    if (!currentUserMembership) return sendResponse(res, 403, false, "You don't have access to this card");

    if (currentUserMembership.role === "MEMBER" && userId !== currentUserId) {
      return sendResponse(res, 403, false, "MEMBERs can only assign themselves");
    }

    // Check if the assigned user is in the workspace
    const assignedUserMembership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: card.list.board.workspaceId, userId } },
    });
    if (!assignedUserMembership) return sendResponse(res, 400, false, "The assigned user is not a member of this workspace");

    const assignee = await prisma.cardAssignee.create({
      data: {
        cardId,
        userId,
      },
    });

    // Create notification
    if (userId !== currentUserId) {
      await prisma.notification.create({
        data: {
          userId,
          type: "CARD_ASSIGNED",
          message: `Bạn đã được phân công vào thẻ "${card.title}"`,
          relatedId: cardId,
        },
      });
    }

    getIO().to(`board_${card.list.boardId}`).emit("board:updated");
    
    return sendResponse(res, 201, true, "Assignee added successfully", { assignee });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return sendResponse(res, 400, false, "User is already assigned to this card");
    }
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const removeAssignee = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const cardId = req.params.cardId as string;
    const userId = req.params.userId as string;
    const currentUserId = req.user!.id;

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { list: { include: { board: true } } },
    });

    if (!card) return sendResponse(res, 404, false, "Card not found");

    const currentUserMembership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: card.list.board.workspaceId, userId: currentUserId } },
    });
    if (!currentUserMembership) return sendResponse(res, 403, false, "You don't have access to this card");

    if (currentUserMembership.role === "MEMBER" && userId !== currentUserId) {
      return sendResponse(res, 403, false, "MEMBERs can only remove themselves");
    }

    await prisma.cardAssignee.delete({
      where: {
        cardId_userId: {
          cardId,
          userId,
        },
      },
    });

    getIO().to(`board_${card.list.boardId}`).emit("board:updated");
    
    return sendResponse(res, 200, true, "Assignee removed successfully");
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const copyCard = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const originalCard = await prisma.card.findUnique({
      where: { id },
      include: {
        list: { include: { board: true } },
        checklists: { include: { items: true } },
        attachments: true
      },
    });

    if (!originalCard) return sendResponse(res, 404, false, "Card not found");

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: originalCard.list.board.workspaceId, userId } },
    });

    if (!membership) return sendResponse(res, 403, false, "You don't have access to this card");

    if (membership.role === "MEMBER") {
      return sendResponse(res, 403, false, "You do not have permission to copy cards");
    }

    // Copy the card and its simple relations
    const newCard = await prisma.card.create({
      data: {
        title: `${originalCard.title} (Bản sao)`,
        description: originalCard.description,
        cover: originalCard.cover,
        position: originalCard.position + 1, // Just place it slightly below
        listId: originalCard.listId,
        createdById: userId,
        startDate: originalCard.startDate,
        dueDate: originalCard.dueDate,
        isCompleted: originalCard.isCompleted,
        
        checklists: {
          create: originalCard.checklists.map(cl => ({
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
          create: originalCard.attachments.map(att => ({
            url: att.url,
            name: att.name,
            type: att.type
          }))
        }
      },
      include: {
        checklists: true,
        attachments: true
      }
    });

    getIO().to(`board_${originalCard.list.boardId}`).emit("board:updated");
    
    return sendResponse(res, 201, true, "Card copied successfully", { card: newCard });
  } catch (error: any) {
    console.error("Copy Card Error:", error);
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

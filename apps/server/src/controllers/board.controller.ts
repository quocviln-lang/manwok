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

    if (membership.role === "MEMBER") {
      return sendResponse(res, 403, false, "You do not have permission to create boards");
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
              include: {
                assignees: {
                  include: {
                    user: {
                      select: { id: true, fullName: true, avatar: true }
                    }
                  }
                },
                _count: {
                  select: {
                    checklists: true,
                    attachments: true,
                    comments: true,
                  }
                }
              }
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

    return sendResponse(res, 200, true, "Board fetched successfully", { 
      board,
      isMember: !!membership,
      currentUserRole: membership ? membership.role : null,
      currentUserId: userId
    });
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

    if (membership.role === "MEMBER") {
      return sendResponse(res, 403, false, "You do not have permission to update board settings");
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

export const getArchivedItems = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const board = await prisma.board.findUnique({ where: { id } });
    if (!board) return sendResponse(res, 404, false, "Board not found");

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: board.workspaceId, userId } },
    });

    if (!membership) return sendResponse(res, 403, false, "Access denied");

    const archivedLists = await prisma.list.findMany({
      where: { boardId: id, archived: true },
      orderBy: { updatedAt: 'desc' }
    });

    const archivedCards = await prisma.card.findMany({
      where: { list: { boardId: id }, archived: true },
      include: { list: { select: { title: true } } },
      orderBy: { updatedAt: 'desc' }
    });

    return sendResponse(res, 200, true, "Archived items fetched", {
      lists: archivedLists,
      cards: archivedCards
    });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const getActivities = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const board = await prisma.board.findUnique({ where: { id } });
    if (!board) return sendResponse(res, 404, false, "Board not found");

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: board.workspaceId, userId } },
    });

    if (!membership) return sendResponse(res, 403, false, "Access denied");

    const activities = await prisma.activity.findMany({
      where: { boardId: id },
      include: {
        user: { select: { id: true, fullName: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });
    
    const totalActivities = await prisma.activity.count({ where: { boardId: id } });
    const hasMore = page * limit < totalActivities;

    return sendResponse(res, 200, true, "Activities fetched", { activities, hasMore, totalActivities });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const createJoinRequest = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const board = await prisma.board.findUnique({
      where: { id },
      include: { workspace: { include: { owner: true } } }
    });
    if (!board) return sendResponse(res, 404, false, "Board not found");

    if (board.visibility !== "PUBLIC") {
      return sendResponse(res, 403, false, "You cannot request to join a private board");
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: board.workspaceId, userId } },
    });

    if (membership) {
      return sendResponse(res, 400, false, "You are already a member of this workspace");
    }

    const existingRequest = await prisma.boardJoinRequest.findFirst({
      where: { boardId: id, userId, status: "PENDING" }
    });

    if (existingRequest) {
      return sendResponse(res, 400, false, "You already have a pending join request");
    }

    const joinRequest = await prisma.boardJoinRequest.create({
      data: {
        boardId: id,
        userId
      }
    });
    
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });

    // Notify board workspace owner
    await prisma.notification.create({
      data: {
        userId: board.workspace.ownerId,
        type: "BOARD_JOIN_REQUEST",
        message: `${currentUser?.fullName || 'Someone'} requested to join board "${board.title}"`,
        relatedId: joinRequest.id
      }
    });

    return sendResponse(res, 201, true, "Join request sent successfully");
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

const respondJoinRequestSchema = z.object({
  accept: z.boolean()
});

export const respondToJoinRequest = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const requestId = req.params.requestId as string;
    const userId = req.user!.id;

    const parsedData = respondJoinRequestSchema.safeParse(req.body);
    if (!parsedData.success) {
      return sendResponse(res, 400, false, "Invalid input data", parsedData.error.issues);
    }

    const joinRequest = await prisma.boardJoinRequest.findUnique({ 
      where: { id: requestId },
      include: { board: true }
    });
    
    if (!joinRequest) return sendResponse(res, 404, false, "Request not found");

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: joinRequest.board.workspaceId, userId } },
    });

    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      return sendResponse(res, 403, false, "You don't have permission to respond to requests");
    }

    if (joinRequest.status !== "PENDING") {
      return sendResponse(res, 400, false, "Request has already been processed");
    }

    if (parsedData.data.accept) {
      await prisma.workspaceMember.upsert({
        where: { workspaceId_userId: { workspaceId: joinRequest.board.workspaceId, userId: joinRequest.userId } },
        create: { workspaceId: joinRequest.board.workspaceId, userId: joinRequest.userId, role: "MEMBER" },
        update: {}
      });

      await prisma.boardJoinRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED" }
      });
    } else {
      await prisma.boardJoinRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" }
      });
    }

    return sendResponse(res, 200, true, `Request ${parsedData.data.accept ? 'approved' : 'rejected'}`);
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

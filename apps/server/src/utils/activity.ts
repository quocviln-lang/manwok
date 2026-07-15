import prisma from "../prisma/prisma.js";

type LogActivityParams = {
  boardId: string;
  userId: string;
  action: string;
  entityType: "CARD" | "LIST" | "BOARD";
  entityId: string;
  entityTitle?: string;
  details?: Record<string, any>;
};

export const logActivity = async (params: LogActivityParams) => {
  try {
    await prisma.activity.create({
      data: {
        boardId: params.boardId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        entityTitle: params.entityTitle ?? null,
        details: params.details || {},
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};

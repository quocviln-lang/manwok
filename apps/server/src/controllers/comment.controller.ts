import type { Response } from "express";
import { z } from "zod";
import prisma from "../prisma/prisma.js";
import { sendResponse } from "../utils/response.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

export const createComment = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const cardId = req.params.cardId as string;
    const userId = req.user!.id;

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { 
        list: { include: { board: true } },
        assignees: true,
      },
    });

    if (!card) return sendResponse(res, 404, false, "Card not found");

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: card.list.board.workspaceId, userId } },
    });

    if (!membership) {
      return sendResponse(res, 403, false, "You don't have access to this card");
    }

    const parsedData = createCommentSchema.safeParse(req.body);
    if (!parsedData.success) {
      return sendResponse(res, 400, false, "Invalid input data", parsedData.error.issues);
    }

    const comment = await prisma.comment.create({
      data: {
        content: parsedData.data.content,
        cardId,
        userId,
      },
    });

    const userIdsToNotify = new Set(card.assignees.map(a => a.userId));
    userIdsToNotify.add(card.createdById);
    userIdsToNotify.delete(userId);

    if (userIdsToNotify.size > 0) {
      await prisma.notification.createMany({
        data: Array.from(userIdsToNotify).map(id => ({
          userId: id,
          type: "COMMENT_ADDED",
          message: `Có bình luận mới trong thẻ "${card.title}"`,
          relatedId: cardId,
        })),
      });
    }

    return sendResponse(res, 201, true, "Comment created successfully", { comment });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const deleteComment = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { card: { include: { list: { include: { board: true } } } } },
    });

    if (!comment) return sendResponse(res, 404, false, "Comment not found");

    // Only the author can delete the comment
    if (comment.userId !== userId) {
      return sendResponse(res, 403, false, "You can only delete your own comments");
    }

    await prisma.comment.delete({ where: { id } });

    return sendResponse(res, 200, true, "Comment deleted successfully");
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

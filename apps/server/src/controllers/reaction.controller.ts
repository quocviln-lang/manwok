import type { Response } from "express";
import { z } from "zod";
import prisma from "../prisma/prisma.js";
import { sendResponse } from "../utils/response.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

const reactionSchema = z.object({
  emoji: z.string().min(1),
});

export const toggleReaction = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const commentId = req.params.commentId as string;
    const userId = req.user!.id;

    const parsedData = reactionSchema.safeParse(req.body);
    if (!parsedData.success) return sendResponse(res, 400, false, "Invalid data", parsedData.error.issues);

    const { emoji } = parsedData.data;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { card: { include: { list: { include: { board: true } } } } },
    });

    if (!comment) return sendResponse(res, 404, false, "Comment not found");

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: comment.card.list.board.workspaceId, userId } },
    });
    if (!membership) return sendResponse(res, 403, false, "Access denied");

    const existingReaction = await prisma.commentReaction.findUnique({
      where: {
        commentId_userId_emoji: {
          commentId,
          userId,
          emoji,
        },
      },
    });

    if (existingReaction) {
      // Toggle off
      await prisma.commentReaction.delete({ where: { id: existingReaction.id } });
      return sendResponse(res, 200, true, "Reaction removed");
    } else {
      // Toggle on
      const reaction = await prisma.commentReaction.create({
        data: {
          commentId,
          userId,
          emoji,
        },
      });
      return sendResponse(res, 201, true, "Reaction added", { reaction });
    }
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message);
  }
};

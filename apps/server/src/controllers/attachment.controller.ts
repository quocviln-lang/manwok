import type { Response } from "express";
import { z } from "zod";
import prisma from "../prisma/prisma.js";
import { sendResponse } from "../utils/response.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

const createAttachmentSchema = z.object({
  url: z.string().url(),
  name: z.string().min(1),
  type: z.enum(["link", "file", "image"]).default("link"),
});

export const createAttachment = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const cardId = req.params.cardId as string;
    const userId = req.user!.id;

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { list: { include: { board: true } } },
    });

    if (!card) return sendResponse(res, 404, false, "Card not found");

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: card.list.board.workspaceId, userId } },
    });
    if (!membership) return sendResponse(res, 403, false, "Access denied");

    const parsedData = createAttachmentSchema.safeParse(req.body);
    if (!parsedData.success) return sendResponse(res, 400, false, "Invalid data", parsedData.error.issues);

    const attachment = await prisma.attachment.create({
      data: {
        ...parsedData.data,
        cardId,
      },
    });

    return sendResponse(res, 201, true, "Attachment added", { attachment });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const deleteAttachment = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: { card: { include: { list: { include: { board: true } } } } },
    });

    if (!attachment) return sendResponse(res, 404, false, "Attachment not found");

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: attachment.card.list.board.workspaceId, userId } },
    });
    if (!membership) return sendResponse(res, 403, false, "Access denied");

    await prisma.attachment.delete({ where: { id } });

    return sendResponse(res, 200, true, "Attachment deleted");
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message);
  }
};

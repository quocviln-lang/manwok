import type { Response } from "express";
import { z } from "zod";
import prisma from "../prisma/prisma.js";
import { sendResponse } from "../utils/response.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

const createChecklistSchema = z.object({
  title: z.string().min(1).max(255),
});

export const createChecklist = async (req: AuthRequest, res: Response): Promise<any> => {
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

    const parsedData = createChecklistSchema.safeParse(req.body);
    if (!parsedData.success) return sendResponse(res, 400, false, "Invalid data", parsedData.error.issues);

    const lastChecklist = await prisma.checklist.findFirst({
      where: { cardId },
      orderBy: { position: "desc" },
    });
    const position = lastChecklist ? lastChecklist.position + 65535 : 65535;

    const checklist = await prisma.checklist.create({
      data: {
        title: parsedData.data.title,
        position,
        cardId,
      },
    });

    return sendResponse(res, 201, true, "Checklist created", { checklist });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const updateChecklist = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const parsedData = z.object({ title: z.string().min(1).optional(), position: z.number().optional() }).safeParse(req.body);
    
    if (!parsedData.success) return sendResponse(res, 400, false, "Invalid data");

    const dataToUpdate: any = {};
    if (parsedData.data.title !== undefined) dataToUpdate.title = parsedData.data.title;
    if (parsedData.data.position !== undefined) dataToUpdate.position = parsedData.data.position;

    const checklist = await prisma.checklist.update({
      where: { id },
      data: dataToUpdate,
    });

    return sendResponse(res, 200, true, "Checklist updated", { checklist });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const deleteChecklist = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    await prisma.checklist.delete({ where: { id } });
    return sendResponse(res, 200, true, "Checklist deleted");
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message);
  }
};

const createItemSchema = z.object({ content: z.string().min(1) });

export const createChecklistItem = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const checklistId = req.params.id as string;
    const parsedData = createItemSchema.safeParse(req.body);
    if (!parsedData.success) return sendResponse(res, 400, false, "Invalid data");

    const lastItem = await prisma.checklistItem.findFirst({
      where: { checklistId },
      orderBy: { position: "desc" },
    });
    const position = lastItem ? lastItem.position + 65535 : 65535;

    const item = await prisma.checklistItem.create({
      data: {
        content: parsedData.data.content,
        position,
        checklistId,
      },
    });

    return sendResponse(res, 201, true, "Item created", { item });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const updateChecklistItem = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.itemId as string;
    const parsedData = z.object({ 
      content: z.string().min(1).optional(), 
      isCompleted: z.boolean().optional(),
      position: z.number().optional()
    }).safeParse(req.body);
    
    if (!parsedData.success) return sendResponse(res, 400, false, "Invalid data");

    const dataToUpdate: any = {};
    if (parsedData.data.content !== undefined) dataToUpdate.content = parsedData.data.content;
    if (parsedData.data.isCompleted !== undefined) dataToUpdate.isCompleted = parsedData.data.isCompleted;
    if (parsedData.data.position !== undefined) dataToUpdate.position = parsedData.data.position;

    const item = await prisma.checklistItem.update({
      where: { id },
      data: dataToUpdate,
    });

    return sendResponse(res, 200, true, "Item updated", { item });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const deleteChecklistItem = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.itemId as string;
    await prisma.checklistItem.delete({ where: { id } });
    return sendResponse(res, 200, true, "Item deleted");
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message);
  }
};

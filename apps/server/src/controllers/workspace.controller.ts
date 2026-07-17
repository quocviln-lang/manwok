import type { Response } from "express";
import { z } from "zod";
import prisma from "../prisma/prisma.js";
import { sendResponse } from "../utils/response.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(100),
  description: z.string().optional(),
});

export const createWorkspace = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const parsedData = createWorkspaceSchema.safeParse(req.body);
    if (!parsedData.success) {
      return sendResponse(res, 400, false, "Invalid input data", parsedData.error.issues);
    }

    const { name, description } = parsedData.data;
    const userId = req.user!.id;

    // Check limit (Max 10 workspaces created by user)
    const workspaceCount = await prisma.workspace.count({
      where: { ownerId: userId },
    });

    if (workspaceCount >= 10) {
      return sendResponse(res, 403, false, "You have reached the maximum limit of 10 workspaces.");
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        description: description ?? null,
        ownerId: userId,
        members: {
          create: {
            userId: userId,
            role: "OWNER",
          },
        },
      },
    });

    return sendResponse(res, 201, true, "Workspace created successfully", { workspace });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const getWorkspaces = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user!.id;

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        owner: {
          select: { id: true, fullName: true, email: true, avatar: true },
        },
        _count: {
          select: { members: true, boards: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return sendResponse(res, 200, true, "Workspaces fetched successfully", { workspaces });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const getWorkspaceById = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    // Extra security: even though middleware runs for update/delete,
    // getWorkspaceById might just use standard protect. We must ensure user is a member.
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: id, userId } },
    });

    if (!membership) {
      return sendResponse(res, 403, false, "You are not a member of this workspace");
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, avatar: true },
            },
          },
        },
        boards: {
          include: {
            creator: {
              select: { id: true, fullName: true, avatar: true }
            },
            _count: {
              select: { lists: true }
            }
          }
        },
      },
    });

    if (!workspace) {
      return sendResponse(res, 404, false, "Workspace not found");
    }

    return sendResponse(res, 200, true, "Workspace fetched successfully", { 
      workspace,
      currentUserRole: membership.role
    });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  settings: z.any().optional(),
});

export const updateWorkspace = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const parsedData = updateWorkspaceSchema.safeParse(req.body);

    if (!parsedData.success) {
      return sendResponse(res, 400, false, "Invalid input data", parsedData.error.issues);
    }

    // Filter out undefined properties because Prisma's exactOptionalPropertyTypes is strict
    const dataToUpdate: any = {};
    if (parsedData.data.name !== undefined) dataToUpdate.name = parsedData.data.name;
    if (parsedData.data.description !== undefined) dataToUpdate.description = parsedData.data.description;
    if (parsedData.data.settings !== undefined) dataToUpdate.settings = parsedData.data.settings;

    const updatedWorkspace = await prisma.workspace.update({
      where: { id },
      data: dataToUpdate,
    });

    return sendResponse(res, 200, true, "Workspace updated successfully", { workspace: updatedWorkspace });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const deleteWorkspace = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;

    await prisma.workspace.delete({
      where: { id },
    });

    return sendResponse(res, 200, true, "Workspace deleted successfully");
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const getWorkspaceMembers = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: id, userId } },
    });

    if (!membership) {
      return sendResponse(res, 403, false, "You are not a member of this workspace");
    }

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: id },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, avatar: true },
        },
      },
    });

    return sendResponse(res, 200, true, "Workspace members fetched successfully", { members });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email"),
});

export const inviteMember = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const inviterId = req.user!.id;

    const parsedData = inviteMemberSchema.safeParse(req.body);
    if (!parsedData.success) {
      return sendResponse(res, 400, false, "Invalid input data", parsedData.error.issues);
    }

    const { email } = parsedData.data;

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: id, userId: inviterId } },
    });

    if (!membership) {
      return sendResponse(res, 403, false, "You are not a member of this workspace");
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      select: { settings: true, name: true },
    });

    if (!workspace) {
      return sendResponse(res, 404, false, "Workspace not found");
    }

    const settings = workspace.settings as any;
    const adminOnly = settings?.memberRestriction === "ADMIN_ONLY";

    if (adminOnly && !["OWNER", "ADMIN"].includes(membership.role)) {
      return sendResponse(res, 403, false, "Bạn không có quyền thêm thành viên vào không gian làm việc này");
    }

    const userToInvite = await prisma.user.findUnique({ where: { email } });
    if (!userToInvite) {
      return sendResponse(res, 404, false, "User with this email not found");
    }
    
    const inviter = await prisma.user.findUnique({ where: { id: inviterId } });

    const existingMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: id, userId: userToInvite.id } },
    });

    if (existingMember) {
      return sendResponse(res, 400, false, "User is already a member");
    }

    // Check if invite already exists
    const existingInvite = await prisma.workspaceInvite.findFirst({
      where: { workspaceId: id, email, status: "PENDING" }
    });

    if (existingInvite) {
      return sendResponse(res, 400, false, "An invite is already pending for this user");
    }

    const invite = await prisma.workspaceInvite.create({
      data: {
        workspaceId: id,
        email,
        inviterId,
      }
    });

    await prisma.workspaceActivity.create({
      data: {
        workspaceId: id,
        userId: inviterId,
        action: "INVITE_MEMBER",
        entityType: "MEMBER",
        entityId: userToInvite.id,
        entityTitle: userToInvite.fullName
      }
    });

    await prisma.notification.create({
      data: {
        userId: userToInvite.id,
        type: "WORKSPACE_INVITE",
        message: `${inviter?.fullName || 'Someone'} invited you to join workspace "${workspace?.name}"`,
        relatedId: invite.id
      }
    });

    return sendResponse(res, 201, true, "Invite sent successfully");
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

const respondInviteSchema = z.object({
  accept: z.boolean()
});

export const respondToInvite = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const inviteId = req.params.inviteId as string;
    const userId = req.user!.id;
    
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser) return sendResponse(res, 404, false, "User not found");
    const userEmail = currentUser.email;

    const parsedData = respondInviteSchema.safeParse(req.body);
    if (!parsedData.success) {
      return sendResponse(res, 400, false, "Invalid input data", parsedData.error.issues);
    }

    const invite = await prisma.workspaceInvite.findUnique({ where: { id: inviteId } });
    if (!invite) return sendResponse(res, 404, false, "Invite not found");
    
    if (invite.email !== userEmail) {
      return sendResponse(res, 403, false, "This invite is not for you");
    }
    
    if (invite.status !== "PENDING") {
      return sendResponse(res, 400, false, "Invite has already been processed");
    }

    if (parsedData.data.accept) {
      // Add member
      await prisma.workspaceMember.create({
        data: {
          workspaceId: invite.workspaceId,
          userId,
          role: "MEMBER"
        }
      });
      await prisma.workspaceInvite.update({
        where: { id: inviteId },
        data: { status: "ACCEPTED" }
      });
    } else {
      await prisma.workspaceInvite.update({
        where: { id: inviteId },
        data: { status: "DECLINED" }
      });
    }

    return sendResponse(res, 200, true, `Invite ${parsedData.data.accept ? 'accepted' : 'declined'}`);
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

const updateRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"])
});

export const updateMemberRole = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const memberId = req.params.memberId as string;
    const currentUserId = req.user!.id;

    const parsedData = updateRoleSchema.safeParse(req.body);
    if (!parsedData.success) {
      return sendResponse(res, 400, false, "Invalid input data", parsedData.error.issues);
    }

    const { role } = parsedData.data;

    // Verify currentUser membership
    const currentUserMembership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: id, userId: currentUserId } }
    });

    if (!currentUserMembership || (currentUserMembership.role !== "OWNER" && currentUserMembership.role !== "ADMIN")) {
      return sendResponse(res, 403, false, "You do not have permission to change roles");
    }

    // Get target member
    const targetMember = await prisma.workspaceMember.findUnique({
      where: { id: memberId }
    });

    if (!targetMember || targetMember.workspaceId !== id) {
      return sendResponse(res, 404, false, "Member not found");
    }

    if (targetMember.role === "OWNER") {
      return sendResponse(res, 403, false, "Cannot change role of workspace OWNER");
    }

    if (currentUserMembership.role === "ADMIN" && role === "ADMIN") {
      // Admins might be able to make others ADMIN, or maybe not. 
      // Let's allow ADMIN to promote/demote MEMBER to ADMIN and back.
    }

    const updatedMember = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role }
    });

    return sendResponse(res, 200, true, "Member role updated successfully", { member: updatedMember });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const removeMember = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const memberId = req.params.memberId as string;
    const currentUserId = req.user!.id;

    // Verify currentUser membership
    const currentUserMembership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: id, userId: currentUserId } }
    });

    if (!currentUserMembership || (currentUserMembership.role !== "OWNER" && currentUserMembership.role !== "ADMIN")) {
      return sendResponse(res, 403, false, "You do not have permission to remove members");
    }

    // Get target member
    const targetMember = await prisma.workspaceMember.findUnique({
      where: { id: memberId }
    });

    if (!targetMember || targetMember.workspaceId !== id) {
      return sendResponse(res, 404, false, "Member not found");
    }

    if (targetMember.role === "OWNER") {
      return sendResponse(res, 403, false, "Cannot remove workspace OWNER");
    }

    if (currentUserMembership.role === "ADMIN" && targetMember.role === "ADMIN") {
      return sendResponse(res, 403, false, "ADMIN cannot remove another ADMIN");
    }

    const deletedMember = await prisma.workspaceMember.delete({
      where: { id: memberId },
      include: { user: true }
    });

    await prisma.workspaceActivity.create({
      data: {
        workspaceId: id,
        userId: currentUserId,
        action: "REMOVE_MEMBER",
        entityType: "MEMBER",
        entityId: deletedMember.userId,
        entityTitle: deletedMember.user.fullName
      }
    });

    return sendResponse(res, 200, true, "Member removed successfully");
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const getWorkspaceActivities = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: id, userId } },
    });

    if (!membership) {
      return sendResponse(res, 403, false, "You are not a member of this workspace");
    }

    const activities = await prisma.workspaceActivity.findMany({
      where: { workspaceId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, avatar: true } }
      },
      take: 50
    });

    return sendResponse(res, 200, true, "Activities fetched", { activities });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

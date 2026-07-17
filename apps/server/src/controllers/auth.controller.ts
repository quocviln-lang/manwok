import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../prisma/prisma.js";
import { generateToken } from "../utils/jwt.js";
import { sendResponse } from "../utils/response.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
});

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const parsedData = registerSchema.safeParse(req.body);
    if (!parsedData.success) {
      return sendResponse(res, 400, false, "Invalid input data", parsedData.error.issues);
    }

    const { email, password, fullName } = parsedData.data;

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return sendResponse(res, 400, false, "User already exists with this email");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
      },
    });

    const token = generateToken(user.id);

    return sendResponse(res, 201, true, "User registered successfully", {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        systemRole: user.systemRole,
      },
    });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const parsedData = loginSchema.safeParse(req.body);
    if (!parsedData.success) {
      return sendResponse(res, 400, false, "Invalid input data", parsedData.error.issues);
    }

    const { email, password } = parsedData.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return sendResponse(res, 400, false, "Invalid credentials");
    }

    if (!user.isActive) {
      return sendResponse(res, 403, false, "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.");
    }

    if (!user.password) {
      return sendResponse(res, 400, false, "Tài khoản này được đăng ký bằng Google. Vui lòng chọn Đăng nhập bằng Google.");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendResponse(res, 400, false, "Invalid credentials");
    }

    const token = generateToken(user.id);

    return sendResponse(res, 200, true, "Login successful", {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        systemRole: user.systemRole,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return sendResponse(res, 401, false, "Not authenticated");
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        systemRole: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return sendResponse(res, 404, false, "User not found");
    }

    if (!user.isActive) {
      return sendResponse(res, 403, false, "Tài khoản của bạn đã bị khóa.");
    }

    return sendResponse(res, 200, true, "User fetched successfully", { user });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const googleLogin = async (req: Request, res: Response): Promise<any> => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return sendResponse(res, 400, false, "Google credential is required");
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID || "",
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return sendResponse(res, 400, false, "Invalid Google token payload");
    }

    const { email, name, picture, sub: googleId } = payload;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          fullName: name || "Google User",
          avatar: picture,
          googleId,
          password: "", // Thêm password rỗng để tránh lỗi nếu cache Prisma chưa update
        },
      });
    } else {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { email },
          data: { googleId },
        });
      }
      
      if (!user.isActive) {
        return sendResponse(res, 403, false, "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.");
      }
    }

    const token = generateToken(user.id);

    return sendResponse(res, 200, true, "Login successful", {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        systemRole: user.systemRole,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Google Authentication failed");
  }
};


const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  avatar: z.string().url().optional(),
});

export const updateProfile = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return sendResponse(res, 401, false, "Not authenticated");
    }

    const parsedData = updateProfileSchema.safeParse(req.body);
    if (!parsedData.success) {
      return sendResponse(res, 400, false, "Invalid input data", parsedData.error.issues);
    }

    const dataToUpdate: { fullName?: string; avatar?: string } = {};
    if (parsedData.data.fullName !== undefined) dataToUpdate.fullName = parsedData.data.fullName;
    if (parsedData.data.avatar !== undefined) dataToUpdate.avatar = parsedData.data.avatar;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        systemRole: true,
      },
    });

    return sendResponse(res, 200, true, "Profile updated successfully", { user: updatedUser });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) return sendResponse(res, 401, false, "Not authenticated");
    const userId = req.user.id;

    const totalTasks = await prisma.cardAssignee.count({ where: { userId } });
    const completedTasks = await prisma.card.count({
      where: { assignees: { some: { userId } }, isCompleted: true }
    });
    const overdueTasks = await prisma.card.count({
      where: {
        assignees: { some: { userId } },
        isCompleted: false,
        dueDate: { lt: new Date() }
      }
    });
    const workspacesCount = await prisma.workspaceMember.count({ where: { userId } });

    // Fetch tasks, order by due date (nulls last if possible, but prisma orderBy dueDate doesn't support nulls last directly, 
    // so we just order by dueDate asc. Nulls will appear first in Postgres by default for ASC, 
    // so we should ideally separate or just fetch them all and sort). Let's fetch all assigned tasks not completed.
    const allAssignedTasks = await prisma.card.findMany({
      where: { assignees: { some: { userId } }, isCompleted: false },
      include: { list: { include: { board: { select: { title: true, id: true } } } } },
    });
    
    // Sort in memory: Tasks with dueDate first, then closest dueDate
    allAssignedTasks.sort((a, b) => {
      if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Chart data: tasks completed in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const completedTasksData = await prisma.card.findMany({
      where: {
        assignees: { some: { userId } },
        isCompleted: true,
        updatedAt: { gte: sevenDaysAgo }
      },
      select: { updatedAt: true }
    });

    const chartDataMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0] as string;
      chartDataMap[dateStr] = 0;
    }

    completedTasksData.forEach(task => {
      const dateStr = task.updatedAt.toISOString().split('T')[0] as string;
      if (chartDataMap[dateStr] !== undefined) {
        chartDataMap[dateStr]++;
      }
    });

    const activityChart = Object.keys(chartDataMap).map(date => ({
      date,
      count: chartDataMap[date]
    }));

    return sendResponse(res, 200, true, "Dashboard stats fetched", {
      stats: { totalTasks, completedTasks, overdueTasks, workspacesCount },
      upcomingTasks: allAssignedTasks,
      activityChart
    });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const changePassword = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user) return sendResponse(res, 401, false, "Not authenticated");
    
    const parsedData = changePasswordSchema.safeParse(req.body);
    if (!parsedData.success) {
      return sendResponse(res, 400, false, "Invalid input data", parsedData.error.issues);
    }
    
    const { currentPassword, newPassword } = parsedData.data;
    
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return sendResponse(res, 404, false, "User not found");
    
    if (!user.password) {
      return sendResponse(res, 400, false, "Tài khoản của bạn đăng nhập bằng Google và chưa có mật khẩu.");
    }
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return sendResponse(res, 400, false, "Mật khẩu hiện tại không đúng");
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    
    return sendResponse(res, 200, true, "Đổi mật khẩu thành công");
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || "Server Error");
  }
};

import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/admin.middleware.js";
import { getStats, getUsers, updateUserRole, toggleUserStatus, deleteUser, getWorkspaces, deleteWorkspace } from "../controllers/admin.controller.js";

const router = Router();

// All routes require authentication and admin role
router.use(protect, requireAdmin);

router.get("/stats", getStats);
router.get("/users", getUsers);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/status", toggleUserStatus);
router.delete("/users/:id", deleteUser);

router.get("/workspaces", getWorkspaces);
router.delete("/workspaces/:id", deleteWorkspace);

export default router;

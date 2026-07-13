import { Router } from "express";
import {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
} from "../controllers/workspace.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { requireWorkspaceRole } from "../middlewares/workspace.middleware.js";

const router = Router();

// Apply protect middleware to all routes in this file
router.use(protect);

router.post("/", createWorkspace);
router.get("/", getWorkspaces);

// ID specific routes
router.get("/:id", getWorkspaceById);
router.patch("/:id", requireWorkspaceRole(["OWNER", "ADMIN"]), updateWorkspace);
router.delete("/:id", requireWorkspaceRole(["OWNER"]), deleteWorkspace);

export default router;

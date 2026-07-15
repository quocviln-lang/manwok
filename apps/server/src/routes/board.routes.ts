import { Router } from "express";
import {
  createBoard,
  getWorkspaceBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
  getArchivedItems,
  getActivities,
  createJoinRequest,
  respondToJoinRequest
} from "../controllers/board.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

// Note: This router will be mounted on two paths:
// 1. /api/workspaces/:workspaceId/boards
// 2. /api/boards
// We use mergeParams to access :workspaceId when mounted under workspaces.
const router = Router({ mergeParams: true });

router.use(protect);

// Routes starting with /api/workspaces/:workspaceId/boards
router.post("/", createBoard);
router.get("/", getWorkspaceBoards);

// Routes starting with /api/boards
router.get("/:id", getBoardById);
router.patch("/:id", updateBoard);
router.delete("/:id", deleteBoard);
router.get("/:id/archived", getArchivedItems);
router.get("/:id/activities", getActivities);
router.post("/:id/join-requests", createJoinRequest);
router.post("/:id/join-requests/:requestId/respond", respondToJoinRequest);

export default router;

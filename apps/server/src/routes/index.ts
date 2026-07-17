import { Router } from "express";
import authRoutes from "./auth.routes.js";
import workspaceRoutes from "./workspace.routes.js";
import boardRoutes from "./board.routes.js";
import listRoutes from "./list.routes.js";
import cardRoutes from "./card.routes.js";
import commentRoutes from "./comment.routes.js";
import uploadRoutes from "./upload.routes.js";
import notificationRoutes from "./notification.routes.js";
import checklistRoutes from "./checklist.routes.js";
import attachmentRoutes from "./attachment.routes.js";
import reactionRoutes from "./reaction.routes.js";
import adminRoutes from "./admin.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/workspaces", workspaceRoutes);

// Board routes
router.use("/workspaces/:workspaceId/boards", boardRoutes);
router.use("/boards", boardRoutes);

// List routes
router.use("/boards/:boardId/lists", listRoutes);
router.use("/lists", listRoutes);

// Card routes
router.use("/lists/:listId/cards", cardRoutes);
router.use("/cards", cardRoutes);

// Checklist routes
router.use("/cards/:cardId/checklists", checklistRoutes);
router.use("/checklists", checklistRoutes);

// Attachment routes
router.use("/cards/:cardId/attachments", attachmentRoutes);
router.use("/attachments", attachmentRoutes);

// Comment routes
router.use("/cards/:cardId/comments", commentRoutes);
router.use("/comments", commentRoutes);

// Reaction routes
router.use("/comments/:commentId/reactions", reactionRoutes);

// Upload routes
router.use("/upload", uploadRoutes);

// Notification routes
router.use("/notifications", notificationRoutes);

export default router;

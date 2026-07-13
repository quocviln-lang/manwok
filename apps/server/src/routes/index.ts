import { Router } from "express";
import authRoutes from "./auth.routes.js";
import workspaceRoutes from "./workspace.routes.js";
import boardRoutes from "./board.routes.js";
import listRoutes from "./list.routes.js";
import cardRoutes from "./card.routes.js";
import commentRoutes from "./comment.routes.js";

const router = Router();

router.use("/auth", authRoutes);
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

// Comment routes
router.use("/cards/:cardId/comments", commentRoutes);
router.use("/comments", commentRoutes);

export default router;

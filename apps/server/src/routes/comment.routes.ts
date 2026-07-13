import { Router } from "express";
import {
  createComment,
  deleteComment,
} from "../controllers/comment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

// Mounted at:
// 1. /api/cards/:cardId/comments (for creation)
// 2. /api/comments (for deletion)
const router = Router({ mergeParams: true });

router.use(protect);

router.post("/", createComment);
router.delete("/:id", deleteComment);

export default router;

import { Router } from "express";
import {
  createList,
  updateList,
  reorderList,
  deleteList,
} from "../controllers/list.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

// Mounted at:
// 1. /api/boards/:boardId/lists (for creation)
// 2. /api/lists (for updates/deletes)
const router = Router({ mergeParams: true });

router.use(protect);

router.post("/", createList);
router.patch("/:id", updateList);
router.patch("/:id/reorder", reorderList);
router.delete("/:id", deleteList);

export default router;

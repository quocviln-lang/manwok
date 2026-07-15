import { Router } from "express";
import {
  createCard,
  getCardById,
  updateCard,
  moveCard,
  deleteCard,
  addAssignee,
  removeAssignee,
  copyCard,
} from "../controllers/card.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

// Mounted at:
// 1. /api/lists/:listId/cards (for creation)
// 2. /api/cards (for the rest)
const router = Router({ mergeParams: true });

router.use(protect);

router.post("/", createCard);

router.get("/:id", getCardById);
router.patch("/:id", updateCard);
router.patch("/:id/move", moveCard);
router.post("/:id/copy", copyCard);
router.delete("/:id", deleteCard);

// Assignees
router.post("/:cardId/assignees", addAssignee);
router.delete("/:cardId/assignees/:userId", removeAssignee);

export default router;

import { Router } from "express";
import {
  createChecklist,
  updateChecklist,
  deleteChecklist,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem
} from "../controllers/checklist.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router({ mergeParams: true });

router.use(protect);

// Mounted at /api/cards/:cardId/checklists and /api/checklists
router.post("/", createChecklist); // when mounted at /api/cards/:cardId/checklists
router.patch("/:id", updateChecklist); // when mounted at /api/checklists
router.delete("/:id", deleteChecklist); 

// Checklist Items
router.post("/:id/items", createChecklistItem); // when mounted at /api/checklists
router.patch("/items/:itemId", updateChecklistItem); // when mounted at /api/checklists
router.delete("/items/:itemId", deleteChecklistItem);

export default router;

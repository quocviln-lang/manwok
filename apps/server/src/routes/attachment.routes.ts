import { Router } from "express";
import { createAttachment, deleteAttachment } from "../controllers/attachment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router({ mergeParams: true });

router.use(protect);

router.post("/", createAttachment); // mounted at /api/cards/:cardId/attachments
router.delete("/:id", deleteAttachment); // mounted at /api/attachments

export default router;

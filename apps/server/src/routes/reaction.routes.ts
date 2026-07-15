import { Router } from "express";
import { toggleReaction } from "../controllers/reaction.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router({ mergeParams: true });

router.use(protect);

router.post("/", toggleReaction); // mounted at /api/comments/:commentId/reactions

export default router;

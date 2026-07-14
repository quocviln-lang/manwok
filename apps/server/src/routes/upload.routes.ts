import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { uploadMiddleware } from "../middlewares/upload.middleware.js";
import { uploadImage } from "../controllers/upload.controller.js";

const router = Router();

// Endpoint for uploading single image
router.post("/", protect, uploadMiddleware.single("image"), uploadImage);

export default router;

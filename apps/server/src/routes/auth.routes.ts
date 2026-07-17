import { Router } from "express";
import { register, login, googleLogin, getMe, updateProfile, getDashboardStats, changePassword } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.get("/me", protect, getMe);
router.patch("/me", protect, updateProfile);
router.get("/dashboard", protect, getDashboardStats);
router.post("/change-password", protect, changePassword);

export default router;

import { Router } from "express";
import { register, login, getCurrentUser, changePassword, forgotPassword,resetPassword} from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticateToken, getCurrentUser);
router.patch("/change-password", authenticateToken, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;

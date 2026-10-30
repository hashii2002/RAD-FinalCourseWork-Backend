import { Router } from "express";
import { getDashboardAnalytics } from "../controllers/analytics.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.get("/dashboard", authenticateToken, getDashboardAnalytics);

export default router;

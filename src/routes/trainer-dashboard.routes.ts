import { Router } from "express";

import { getTrainerDashboard } from "../controllers/trainer-dashboard.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticateToken, getTrainerDashboard);

export default router;
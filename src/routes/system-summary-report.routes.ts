import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { generateSystemSummaryReport } from "../controllers/system-summary-report.controller";

const router = Router();

router.get( "/system-summary", authenticateToken, generateSystemSummaryReport);

export default router;

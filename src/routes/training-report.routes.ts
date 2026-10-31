import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {generateTrainingReport,} from "../controllers/training-report.controller";

const router = Router();

router.get("/training", authenticateToken, generateTrainingReport);

export default router;


import { Router } from "express";
import {createTrainingSession, getMyTrainingSessions,} from "../controllers/training-session.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticateToken, createTrainingSession);
router.get("/my-history", authenticateToken, getMyTrainingSessions);

export default router;

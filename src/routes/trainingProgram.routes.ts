
import { Router } from "express";
import {
  createTrainingProgram,
  getAllTrainingPrograms,
  getTrainingProgramById,
  updateTrainingProgram,
  deleteTrainingProgram,
} from "../controllers/trainingProgram.controller";

import {authenticateToken, authorizeRoles,} from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticateToken, getAllTrainingPrograms);

router.get("/:id", authenticateToken, getTrainingProgramById);

router.post( "/", authenticateToken, authorizeRoles("ADMIN"), createTrainingProgram);

router.put("/:id",authenticateToken, authorizeRoles("ADMIN"), updateTrainingProgram);

router.delete( "/:id", authenticateToken, authorizeRoles("ADMIN"), deleteTrainingProgram);

export default router;

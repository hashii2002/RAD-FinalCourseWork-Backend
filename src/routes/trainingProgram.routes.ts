
import { Router } from "express";

import {
  createTrainingProgram,
  getAllTrainingPrograms,
  getTrainingProgramById,
  updateTrainingProgram,
  deleteTrainingProgram,
} from "../controllers/trainingProgram.controller";

const router = Router();

router.post("/", createTrainingProgram);

router.get("/", getAllTrainingPrograms);

router.get("/:id", getTrainingProgramById);

router.put("/:id", updateTrainingProgram);

router.delete("/:id", deleteTrainingProgram);

export default router;

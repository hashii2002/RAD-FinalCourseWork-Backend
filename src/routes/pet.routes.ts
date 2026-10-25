
import { Router } from "express";

import {
  createPet,
  getAllPets,
  getPetById,
  updatePet,
  deletePet,
} from "../controllers/pet.controller";

const router = Router();

router.post("/", createPet);

router.get("/", getAllPets);

router.get("/:id", getPetById);

router.put("/:id", updatePet);

router.delete("/:id", deletePet);

export default router;

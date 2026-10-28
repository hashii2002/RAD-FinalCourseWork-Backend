
import { Router } from "express";
import {createPet, getAllPets, getPetById, updatePet, deletePet,searchPets} from "../controllers/pet.controller";
import {authenticateToken, authorizeRoles,} from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticateToken, getAllPets);

router.get("/:id", authenticateToken, getPetById);

router.post("/", authenticateToken, authorizeRoles("ADMIN"), createPet);

router.put("/:id",authenticateToken, authorizeRoles("ADMIN"), updatePet);

router.delete( "/:id", authenticateToken, authorizeRoles("ADMIN"), deletePet);

router.get("/search", authenticateToken, searchPets);

export default router;
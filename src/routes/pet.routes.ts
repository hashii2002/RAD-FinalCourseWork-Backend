import { Router } from "express";
import {createPet, getAllPets, getPetById, updatePet, deletePet,searchPets} from "../controllers/pet.controller";
import {authenticateToken, authorizeRoles,} from "../middleware/auth.middleware";
import { uploadPetImage } from "../middleware/upload.middleware";

const router = Router();

router.get("/", authenticateToken, getAllPets);

router.get("/search", authenticateToken, searchPets);

router.get("/:id", authenticateToken, getPetById);

router.post("/", authenticateToken, authorizeRoles("ADMIN"), uploadPetImage, createPet);

router.put("/:id",authenticateToken, authorizeRoles("ADMIN"), uploadPetImage, updatePet);

router.delete( "/:id", authenticateToken, authorizeRoles("ADMIN"), deletePet);

export default router;
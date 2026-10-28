import { Router } from "express";
import { createPetOrder } from "../controllers/pet-order.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticateToken, createPetOrder);

export default router;

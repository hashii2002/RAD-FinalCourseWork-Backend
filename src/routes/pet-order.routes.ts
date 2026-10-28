import { Router } from "express";
import { createPetOrder, getMyPetOrders,getAllPetOrders, updatePetOrderStatus, } from "../controllers/pet-order.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.get("/my-orders", authenticateToken, getMyPetOrders);
router.post("/", authenticateToken, createPetOrder);
router.get("/", authenticateToken, getAllPetOrders);
router.patch("/:orderId/status", authenticateToken, updatePetOrderStatus);

export default router;

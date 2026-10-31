import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {generatePetSalesReport,} from "../controllers/pet-sales-report.controller";

const router = Router();

router.get(
  "/pet-sales",
  authenticateToken,
  generatePetSalesReport
);

export default router;

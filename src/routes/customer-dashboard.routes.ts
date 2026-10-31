import { Router } from "express";
import { getCustomerDashboard } from "../controllers/customer-dashboard.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticateToken, getCustomerDashboard);

export default router;
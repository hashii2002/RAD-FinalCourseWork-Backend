import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import {generatePaymentReport,} from "../controllers/payment-report.controller";

const router = Router();

router.get("/payments", authenticateToken, generatePaymentReport);

export default router;

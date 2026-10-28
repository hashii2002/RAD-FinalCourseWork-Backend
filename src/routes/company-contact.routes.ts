import { Router } from "express";
import {
  getCompanyContact,
  createCompanyContact,
  updateCompanyContact,
} from "../controllers/company-contact.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.get("/", getCompanyContact);
router.post("/", authenticateToken, createCompanyContact);
router.put("/", authenticateToken, updateCompanyContact);

export default router;


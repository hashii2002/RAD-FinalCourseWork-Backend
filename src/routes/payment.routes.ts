import { Router } from "express";

import {
  createPayment,
  getAllPayments,
  getMyPayments,
  getPaymentById,
  updatePayment,
  addPaymentTransaction,
  deletePayment,
} from "../controllers/payment.controller";

import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.post( "/", authenticateToken, createPayment);

router.get( "/", authenticateToken, getAllPayments);

router.get( "/my-payments", authenticateToken, getMyPayments);

router.get( "/:paymentId", authenticateToken, getPaymentById);

router.put( "/:paymentId", authenticateToken, updatePayment);

router.post("/:paymentId/transactions", authenticateToken, addPaymentTransaction);

router.delete("/:paymentId", authenticateToken, deletePayment);

export default router;

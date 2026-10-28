import { Router } from "express";
import { createTrainingBooking, getMyTrainingBookings,} from "../controllers/training-booking.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.get("/my-bookings", authenticateToken, getMyTrainingBookings);
router.post("/", authenticateToken, createTrainingBooking);

export default router;

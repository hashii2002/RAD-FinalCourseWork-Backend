import { Router } from "express";
import { 
    createTrainingBooking, 
    createTrainingBookingByAdmin,
    getMyTrainingBookings, 
    getAllTrainingBookings, 
    approveTrainingBooking,
    rejectTrainingBooking, 
    assignTrainingTrainer,
    updateTrainingProgress,
} from "../controllers/training-booking.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticateToken, getAllTrainingBookings);
router.get("/my-bookings", authenticateToken, getMyTrainingBookings);
router.post("/", authenticateToken, createTrainingBooking);
router.patch("/:bookingId/approve", authenticateToken,approveTrainingBooking);
router.patch("/:bookingId/assign-trainer", authenticateToken,assignTrainingTrainer);
router.patch("/:bookingId/progress", authenticateToken, updateTrainingProgress);
router.patch("/:bookingId/reject", authenticateToken, rejectTrainingBooking);
router.post("/admin", authenticateToken, createTrainingBookingByAdmin);

export default router;

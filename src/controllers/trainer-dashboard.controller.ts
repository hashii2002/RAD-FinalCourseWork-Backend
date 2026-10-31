import { Request, Response } from "express";

import User from "../models/user.model";
import TrainingBooking from "../models/training-booking.model";
import TrainingSession from "../models/training-session.model";

export const getTrainerDashboard = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {

    if (req.user?.role !== "TRAINER") {
      res.status(403).json({
        success: false,
        message: "Only trainers can access the trainer dashboard",
      });
      return;
    }

    const trainer = await User.findById(req.user.userId);

    if (!trainer || !trainer.isActive || trainer.role !== "TRAINER") {
      res.status(403).json({
        success: false,
        message: "Active trainer account not found",
      });
      return;
    }

    const trainerId = trainer.userId;

    const bookings = await TrainingBooking.find({
      trainerId,
    }).sort({ appointmentDate: 1 });

    const sessions = await TrainingSession.find({
      trainerId,
    }).sort({ sessionDate: -1 });

    const bookingSummary = {
      total: bookings.length,

      pending: bookings.filter(
        (booking) => booking.status === "PENDING"
      ).length,

      approved: bookings.filter(
        (booking) => booking.status === "APPROVED"
      ).length,

      inProgress: bookings.filter(
        (booking) => booking.status === "IN_PROGRESS"
      ).length,

      completed: bookings.filter(
        (booking) => booking.status === "COMPLETED"
      ).length,

      rejected: bookings.filter(
        (booking) => booking.status === "REJECTED"
      ).length,

      cancelled: bookings.filter(
        (booking) => booking.status === "CANCELLED"
      ).length,
    };

    const sessionSummary = {
      total: sessions.length,

      totalTrainingMinutes: sessions.reduce(
        (total, session) => total + session.durationMinutes,
        0
      ),

      averageProgress:
        bookings.length > 0
          ? Number(
              (
                bookings.reduce(
                  (total, booking) =>
                    total + booking.progressPercentage,
                  0
                ) / bookings.length
              ).toFixed(2)
            )
          : 0,
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = bookings.filter((booking) => {
      const appointmentDate = new Date(booking.appointmentDate);

      return (
        appointmentDate >= today &&
        appointmentDate < tomorrow &&
        ["APPROVED", "IN_PROGRESS"].includes(booking.status)
      );
    });

    res.status(200).json({
      success: true,
      message: "Trainer dashboard retrieved successfully",

      data: {
        trainer: {
          userId: trainer.userId,
          name: trainer.name,
          email: trainer.email,
        },

        summary: {
          bookings: bookingSummary,
          sessions: sessionSummary,
          todayAppointments: todayAppointments.length,
        },

        todayAppointments,

        assignedBookings: bookings,

        trainingSessions: sessions,
      },
    });
  } catch (error) {
    console.error("Get trainer dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve trainer dashboard",
    });
  }
};
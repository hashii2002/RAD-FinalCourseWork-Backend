import { Request, Response } from "express";
import TrainingBooking from "../models/training-booking.model";
import TrainingProgram from "../models/trainingProgram.model";
import TrainingSession from "../models/training-session.model";
import User from "../models/user.model";

export const generateTrainingReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Admin Authorization
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Only administrators can access training reports",
      });
      return;
    }

    const admin = await User.findById(req.user.userId);

    if (!admin || !admin.isActive || admin.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Active administrator account not found",
      });
      return;
    }

    // Get Training Bookings
    const bookings = await TrainingBooking.find().sort({
      appointmentDate: -1,
    });

    const bookingIds = bookings.map((booking) => booking.bookingId);

    const programIds = [
      ...new Set(bookings.map((booking) => booking.trainingProgramId)),
    ];

    const userIds = [
      ...new Set(
        bookings.flatMap((booking) =>
          [booking.customerId, booking.trainerId].filter(
            (id): id is string => Boolean(id)
          )
        )
      ),
    ];

    // Get Related Data
    const [programs, users, sessions] = await Promise.all([
      TrainingProgram.find({
        _id: { $in: programIds },
      }),

      User.find({
        userId: { $in: userIds },
      }),

      TrainingSession.find({
        bookingId: { $in: bookingIds },
      }).sort({ sessionDate: -1 }),
    ]);

    const programMap = new Map(
      programs.map((program) => [String(program._id), program])
    );

    const userMap = new Map(
      users.map((user) => [user.userId, user])
    );

    // Booking Summary
    const summary = {
      total: bookings.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      inProgress: 0,
      completed: 0,
    };

    bookings.forEach((booking) => {
      switch (booking.status) {
        case "PENDING":
          summary.pending++;
          break;
        case "APPROVED":
          summary.approved++;
          break;
        case "REJECTED":
          summary.rejected++;
          break;
        case "CANCELLED":
          summary.cancelled++;
          break;
        case "IN_PROGRESS":
          summary.inProgress++;
          break;
        case "COMPLETED":
          summary.completed++;
          break;
      }
    });

    // Training Progress
    const averageProgress =
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
        : 0;

    // Total Training Duration
    const totalTrainingMinutes = sessions.reduce(
      (total, session) => total + session.durationMinutes,
      0
    );

    // Prepare Booking Details
    const bookingDetails = bookings.map((booking) => {
      const program = programMap.get(
        String(booking.trainingProgramId)
      );

      const customer = userMap.get(booking.customerId);

      const trainer = booking.trainerId
        ? userMap.get(booking.trainerId)
        : undefined;

      // Get Sessions Related to Booking
      const bookingSessions = sessions
        .filter(
          (session) => session.bookingId === booking.bookingId
        )
        .map((session) => ({
          sessionDate: session.sessionDate,
          durationMinutes: session.durationMinutes,
          activities: session.activities,
          petCondition: session.petCondition,
          progressPercentage: session.progressPercentage,
          trainerNotes: session.trainerNotes || "",
          nextSessionPlan: session.nextSessionPlan || "",
        }));

      return {
        bookingId: booking.bookingId,
        status: booking.status,

        trainingProgramId: booking.trainingProgramId,
        trainingProgramName: program?.name || "Not Available",

        customerId: booking.customerId,
        customerName: customer?.name || "Not Available",

        trainerId: booking.trainerId || "",
        trainerName: trainer?.name || "Not Assigned",

        petName: booking.petName,
        species: booking.species,
        breed: booking.breed,
        ageMonths: booking.ageMonths,

        appointmentDate: booking.appointmentDate,
        appointmentTime: booking.appointmentTime,

        startDate: booking.startDate,
        expectedEndDate: booking.expectedEndDate,
        actualEndDate: booking.actualEndDate,

        initialCondition: booking.initialCondition,
        currentCondition: booking.currentCondition || "",

        progressPercentage: booking.progressPercentage,

        totalSessions: bookingSessions.length,
        sessions: bookingSessions,
      };
    });

    res.status(200).json({
      success: true,
      message: "Training report data retrieved successfully",

      data: {
        summary: {
          ...summary,
          averageProgress,
          totalSessions: sessions.length,
          totalTrainingMinutes,
        },

        bookings: bookingDetails,

        reportInfo: {
          reportType: "Training Management Report",
          generatedBy: "PawPath Administrator",
          generatedAt: new Date(),
        },
      },
    });
  } catch (error) {
    console.error("Generate training report error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve training report data",
      });
    }
  }
};

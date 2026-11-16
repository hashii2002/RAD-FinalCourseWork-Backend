import { Request, Response } from "express";
import TrainingSession from "../models/training-session.model";
import TrainingBooking from "../models/training-booking.model";
import User from "../models/user.model";
import Counter from "../models/counter.model";

export const createTrainingSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const trainerMongoId = req.user?.userId;
    const role = req.user?.role;

    if (role !== "TRAINER") {
      res.status(403).json({
        success: false,
        message: "Only trainers can create training sessions",
      });
      return;
    }

    const trainer = await User.findById(trainerMongoId);

    if (!trainer || !trainer.isActive || trainer.role !== "TRAINER") {
      res.status(403).json({
        success: false,
        message: "Active trainer account not found",
      });
      return;
    }

    const {
      bookingId,
      sessionDate,
      durationMinutes,
      activities,
      petCondition,
      progressPercentage,
      trainerNotes,
      nextSessionPlan,
    } = req.body;

    if (
      !bookingId ||
      !sessionDate ||
      durationMinutes === undefined ||
      !activities?.trim?.() ||
      !petCondition?.trim?.() ||
      progressPercentage === undefined
    ) {
      res.status(400).json({
        success: false,
        message: "Please provide all required session details",
      });
      return;
    }

    if (
      !Number.isInteger(Number(durationMinutes)) ||
      Number(durationMinutes) < 1 ||
      Number(durationMinutes) > 1440
    ) {
      res.status(400).json({
        success: false,
        message: "Duration must be between 1 and 1440 minutes",
      });
      return;
    }

    const progress = Number(progressPercentage);

    if (
      !Number.isFinite(progress) ||
      progress < 0 ||
      progress > 100
    ) {
      res.status(400).json({
        success: false,
        message: "Progress must be between 0 and 100",
      });
      return;
    }

    const parsedSessionDate = new Date(sessionDate);

    if (Number.isNaN(parsedSessionDate.getTime())) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid session date",
      });
      return;
    }

    const booking = await TrainingBooking.findOne({ bookingId });

    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Training booking not found",
      });
      return;
    }

    if (booking.trainerId !== trainer.userId) {
      res.status(403).json({
        success: false,
        message: "You are not assigned to this training booking",
      });
      return;
    }

    if (
      booking.status !== "APPROVED" &&
      booking.status !== "IN_PROGRESS"
    ) {
      res.status(400).json({
        success: false,
        message: "Only approved or ongoing bookings can receive sessions",
      });
      return;
    }

    const counter = await Counter.findOneAndUpdate(
      { _id: "trainingSessionId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const sessionId = `SES-${String(counter.seq).padStart(4, "0")}`;

    const session = await TrainingSession.create({
      sessionId,
      bookingId: booking.bookingId,
      trainerId: trainer.userId,
      sessionDate: parsedSessionDate,
      durationMinutes: Number(durationMinutes),
      activities: activities.trim(),
      petCondition: petCondition.trim(),
      progressPercentage: progress,
      trainerNotes,
      nextSessionPlan,
    });

    booking.currentCondition = petCondition.trim();
    booking.progressPercentage = progress;

    if (progress === 100) {
      booking.status = "COMPLETED";
      booking.actualEndDate = parsedSessionDate;
    } else {
      booking.status = "IN_PROGRESS";

      if (!booking.startDate) {
        booking.startDate = parsedSessionDate;
      }
    }

    await booking.save();

    res.status(201).json({
      success: true,
      message: "Training session created successfully",
      data: {
        session,
        bookingProgress: {
          bookingId: booking.bookingId,
          status: booking.status,
          progressPercentage: booking.progressPercentage,
          currentCondition: booking.currentCondition,
        },
      },
    });
  } catch (error) {
    console.error("Create training session error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create training session",
    });
  }
};

export const getMyTrainingSessions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const mongoId = req.user?.userId;
    const role = req.user?.role;

    if (role !== "TRAINER" && role !== "CUSTOMER") {
      res.status(403).json({
        success: false,
        message: "You are not authorized to view training sessions",
      });
      return;
    }

    const user = await User.findById(mongoId);

    if (!user || !user.isActive || user.role !== role) {
      res.status(403).json({
        success: false,
        message: "Active user account not found",
      });
      return;
    }

    let sessions;

    if (role === "TRAINER") {
      sessions = await TrainingSession.find({
        trainerId: user.userId,
      }).sort({ sessionDate: -1 });
    } else {
      
      const bookings = await TrainingBooking.find({
        customerId: user.userId,
      }).select("bookingId");

      const bookingIds = bookings.map(
        (booking) => booking.bookingId
      );

      sessions = await TrainingSession.find({
        bookingId: { $in: bookingIds },
      }).sort({ sessionDate: -1 });
    }

    res.status(200).json({
      success: true,
      message: "Training sessions retrieved successfully",
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    console.error("Get training sessions error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve training sessions",
    });
  }
};


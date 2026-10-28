import { Request, Response } from "express";
import TrainingBooking from "../models/training-booking.model";
import TrainingProgram from "../models/trainingProgram.model";
import User from "../models/user.model";
import Counter from "../models/counter.model";

export const createTrainingBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      trainingProgramId,
      petName,
      species,
      breed,
      ageMonths,
      initialCondition,
      appointmentDate,
      appointmentTime,
    } = req.body;

    // Validate 
    if (
      typeof trainingProgramId !== "string" ||
      !trainingProgramId.trim() ||
      typeof petName !== "string" ||
      !petName.trim() ||
      typeof species !== "string" ||
      !species.trim() ||
      typeof breed !== "string" ||
      !breed.trim() ||
      typeof ageMonths !== "number" ||
      !Number.isInteger(ageMonths) ||
      typeof initialCondition !== "string" ||
      !initialCondition.trim() ||
      typeof appointmentDate !== "string" ||
      !appointmentDate.trim() ||
      typeof appointmentTime !== "string" ||
      !appointmentTime.trim()
    ) {
      res.status(400).json({
        success: false,
        message: "Please provide all required training booking details",
      });
      return;
    }

    if (ageMonths < 0 || ageMonths > 1200) {
      res.status(400).json({
        success: false,
        message: "Pet age must be between 0 and 1200 months",
      });
      return;
    }

    if (
      petName.trim().length > 100 ||
      species.trim().length > 100 ||
      breed.trim().length > 100 ||
      initialCondition.trim().length > 1000
    ) {
      res.status(400).json({
        success: false,
        message: "One or more fields exceed the allowed length",
      });
      return;
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(appointmentTime)) {
      res.status(400).json({
        success: false,
        message: "Appointment time must use HH:mm format",
      });
      return;
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!datePattern.test(appointmentDate)) {
      res.status(400).json({
        success: false,
        message: "Appointment date must use YYYY-MM-DD format",
      });
      return;
    }

    const parsedDate = new Date(`${appointmentDate}T00:00:00.000Z`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== appointmentDate
    ) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid appointment date",
      });
      return;
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (parsedDate < today) {
      res.status(400).json({
        success: false,
        message: "Appointment date cannot be in the past",
      });
      return;
    }

    const authenticatedUserId = req.user?.userId;

    if (!authenticatedUserId) {
      res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
      return;
    }

    if (req.user?.role !== "CUSTOMER") {
      res.status(403).json({
        success: false,
        message: "Only customers can create training bookings",
      });
      return;
    }

    const customer = await User.findById(authenticatedUserId);

    if (!customer || !customer.isActive) {
      res.status(401).json({
        success: false,
        message: "Active customer account was not found",
      });
      return;
    }

    const program = await TrainingProgram.findById(
      trainingProgramId.trim()
    );

    if (!program) {
      res.status(404).json({
        success: false,
        message: "Training program was not found",
      });
      return;
    }

    if (program.status !== "ACTIVE") {
      res.status(409).json({
        success: false,
        message: "This training program is not currently available",
      });
      return;
    }

    const counter = await Counter.findOneAndUpdate(
      { _id: "trainingBookingId" },
      { $inc: { seq: 1 } },
      {
        returnDocument: "after",
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    if (!counter) {
      throw new Error("Unable to generate training booking ID");
    }

    const bookingId = `TRB-${String(counter.seq).padStart(4, "0")}`;

    const booking = await TrainingBooking.create({
      bookingId,
      customerId: customer.userId,
      trainingProgramId: program._id,
      petName: petName.trim(),
      species: species.trim(),
      breed: breed.trim(),
      ageMonths,
      initialCondition: initialCondition.trim(),
      appointmentDate: parsedDate,
      appointmentTime,
      progressPercentage: 0,
      status: "PENDING",
    });

    res.status(201).json({
      success: true,
      message: "Training booking request submitted successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Create training booking error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create training booking",
    });
  }
};


export const getMyTrainingBookings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {

    if (req.user?.role !== "CUSTOMER") {
      res.status(403).json({
        success: false,
        message: "Only customers can view their training bookings",
      });
      return;
    }

    const authenticatedUserId = req.user?.userId;

    if (!authenticatedUserId) {
      res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
      return;
    }

    const customer = await User.findById(authenticatedUserId);

    if (!customer || !customer.isActive) {
      res.status(401).json({
        success: false,
        message: "Active customer account was not found",
      });
      return;
    }

    const bookings = await TrainingBooking.find({
      customerId: customer.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Your training bookings retrieved successfully",
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Get customer training bookings error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve your training bookings",
    });
  }
};

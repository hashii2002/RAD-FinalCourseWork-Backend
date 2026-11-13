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

export const getAllTrainingBookings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Only admins can view all training bookings",
      });
      return;
    }

    const bookings = await TrainingBooking.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "Training bookings retrieved successfully",
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("Get all training bookings error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve training bookings",
    });
  }
};


export const approveTrainingBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Only admins can approve training bookings",
      });
      return;
    }

    const { bookingId } = req.params;

    const booking = await TrainingBooking.findOne({ bookingId });

    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Training booking was not found",
      });
      return;
    }

    if (booking.status !== "PENDING") {
      res.status(409).json({
        success: false,
        message: "Only pending bookings can be approved",
      });
      return;
    }

    booking.status = "APPROVED";
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Training booking approved successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Approve training booking error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to approve training booking",
    });
  }
};


export const assignTrainingTrainer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Only admins can assign trainers",
      });
      return;
    }

    const { bookingId } = req.params;
    const { trainerId } = req.body;

    if (typeof trainerId !== "string" || !trainerId.trim()) {
      res.status(400).json({
        success: false,
        message: "Trainer ID is required",
      });
      return;
    }

    const booking = await TrainingBooking.findOne({ bookingId });

    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Training booking was not found",
      });
      return;
    }

    if (!["APPROVED", "IN_PROGRESS"].includes(booking.status)) {
      res.status(409).json({
        success: false,
        message: "Only approved or in-progress bookings can be assigned",
      });
      return;
    }

    const trainer = await User.findOne({
      userId: trainerId.trim(),
      role: "TRAINER",
      isActive: true,
    });

    if (!trainer) {
      res.status(404).json({
        success: false,
        message: "Active trainer was not found",
      });
      return;
    }

    booking.trainerId = trainer.userId;
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Trainer assigned successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Assign training trainer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to assign trainer",
    });
  }
};

export const updateTrainingProgress = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (req.user?.role !== "TRAINER") {
      res.status(403).json({
        success: false,
        message: "Only trainers can update training progress",
      });
      return;
    }

    const { bookingId } = req.params;
    const { currentCondition, progressPercentage, expectedEndDate } =
      req.body;

    if (
      typeof currentCondition !== "string" ||
      !currentCondition.trim() ||
      currentCondition.trim().length > 1000
    ) {
      res.status(400).json({
        success: false,
        message: "A valid current condition is required",
      });
      return;
    }

    if (
      typeof progressPercentage !== "number" ||
      !Number.isFinite(progressPercentage) ||
      progressPercentage < 0 ||
      progressPercentage > 100
    ) {
      res.status(400).json({
        success: false,
        message: "Progress must be a number between 0 and 100",
      });
      return;
    }

    if (
      expectedEndDate !== undefined &&
      (
        typeof expectedEndDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(expectedEndDate) ||
        Number.isNaN(
          new Date(`${expectedEndDate}T00:00:00.000Z`).getTime()
        ) ||
        new Date(`${expectedEndDate}T00:00:00.000Z`)
          .toISOString()
          .slice(0, 10) !== expectedEndDate
      )
    ) {
      res.status(400).json({
        success: false,
        message: "Expected end date must be a valid YYYY-MM-DD date",
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

    const trainer = await User.findById(authenticatedUserId);

    if (!trainer || !trainer.isActive || trainer.role !== "TRAINER") {
      res.status(401).json({
        success: false,
        message: "Active trainer account was not found",
      });
      return;
    }

    const booking = await TrainingBooking.findOne({ bookingId });

    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Training booking was not found",
      });
      return;
    }

    if (booking.trainerId !== trainer.userId) {
      res.status(403).json({
        success: false,
        message: "This booking is not assigned to you",
      });
      return;
    }

    if (!["APPROVED", "IN_PROGRESS"].includes(booking.status)) {
      res.status(409).json({
        success: false,
        message: "This booking cannot receive progress updates",
      });
      return;
    }

    booking.currentCondition = currentCondition.trim();
    booking.progressPercentage = progressPercentage;

    if (expectedEndDate !== undefined) {
      booking.expectedEndDate = new Date(
        `${expectedEndDate}T00:00:00.000Z`
      );
    }

    if (progressPercentage > 0 && !booking.startDate) {
      booking.startDate = new Date();
    }

    if (progressPercentage === 100) {
      booking.status = "COMPLETED";
      booking.actualEndDate = new Date();
    } else {
      booking.status = "IN_PROGRESS";
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message:
        booking.status === "COMPLETED"
          ? "Training completed successfully"
          : "Training progress updated successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Update training progress error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update training progress",
    });
  }
};


export const rejectTrainingBooking = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {

    if (req.user?.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Only admins can reject training bookings",
      });
      return;
    }

    const { bookingId } = req.params;
    const booking = await TrainingBooking.findOne({ bookingId });

    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Training booking was not found",
      });
      return;
    }

    if (booking.status !== "PENDING") {
      res.status(409).json({
        success: false,
        message: "Only pending bookings can be rejected",
      });
      return;
    }

    booking.status = "REJECTED";

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Training booking rejected successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Reject training booking error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to reject training booking",
    });
  }
};

export const createTrainingBookingByAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {

    if (req.user?.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Only admins can create training bookings",
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

    const admin = await User.findById(authenticatedUserId);

    if (!admin || !admin.isActive || admin.role !== "ADMIN") {
      res.status(401).json({
        success: false,
        message: "Active admin account was not found",
      });
      return;
    }

    const {
      customerId,
      trainingProgramId,
      petName,
      species,
      breed,
      ageMonths,
      initialCondition,
      appointmentDate,
      appointmentTime,
    } = req.body;

    if (
      typeof customerId !== "string" ||
      !customerId.trim() ||
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
      customerId.trim().length > 50 ||
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

    if (!/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
      res.status(400).json({
        success: false,
        message: "Appointment date must use YYYY-MM-DD format",
      });
      return;
    }

    const parsedDate = new Date(
      `${appointmentDate}T00:00:00.000Z`
    );

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

    const customer = await User.findOne({
      userId: customerId.trim(),
      role: "CUSTOMER",
      isActive: true,
    });

    if (!customer) {
      res.status(404).json({
        success: false,
        message: "Active customer was not found",
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
      message: "Training booking created successfully by admin",
      data: booking,
    });
  } catch (error) {
    console.error("Admin create training booking error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create training booking",
    });
  }
};






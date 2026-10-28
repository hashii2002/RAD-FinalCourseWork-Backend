
import { Schema, model } from "mongoose";

export interface ITrainingBooking {
  bookingId: string;
  customerId: string;
  trainingProgramId: string;
  trainerId?: string;
  petName: string;
  species: string;
  breed: string;
  ageMonths: number;
  initialCondition: string;
  appointmentDate: Date;
  appointmentTime: string;
  startDate?: Date;
  expectedEndDate?: Date;
  actualEndDate?: Date;
  currentCondition?: string;
  progressPercentage: number;

  status:
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED"
    | "IN_PROGRESS"
    | "COMPLETED";
}

const trainingBookingSchema = new Schema<ITrainingBooking>(
  {
    bookingId: {
      type: String,
      required: [true, "Booking ID is required"],
      unique: true,
      trim: true,
    },

    customerId: {
      type: String,
      required: [true, "Customer ID is required"],
      trim: true,
    },

    trainingProgramId: {
      type: String,
      required: [true, "Training program ID is required"],
      trim: true,
    },

    trainerId: {
      type: String,
      trim: true,
    },

    petName: {
      type: String,
      required: [true, "Pet name is required"],
      trim: true,
    },

    species: {
      type: String,
      required: [true, "Pet species is required"],
      trim: true,
    },

    breed: {
      type: String,
      required: [true, "Pet breed is required"],
      trim: true,
    },

    ageMonths: {
      type: Number,
      required: [true, "Pet age is required"],
      min: [0, "Pet age cannot be negative"],
    },

    initialCondition: {
      type: String,
      required: [true, "Initial pet condition is required"],
      trim: true,
      maxlength: [1000, "Condition cannot exceed 1000 characters"],
    },

    appointmentDate: {
      type: Date,
      required: [true, "Appointment date is required"],
    },

    appointmentTime: {
      type: String,
      required: [true, "Appointment time is required"],
      trim: true,
    },

    startDate: {
      type: Date,
    },

    expectedEndDate: {
      type: Date,
    },

    actualEndDate: {
      type: Date,
    },

    currentCondition: {
      type: String,
      trim: true,
      maxlength: [1000, "Condition cannot exceed 1000 characters"],
    },

    progressPercentage: {
      type: Number,
      default: 0,
      min: [0, "Progress cannot be less than 0"],
      max: [100, "Progress cannot exceed 100"],
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "APPROVED",
        "REJECTED",
        "CANCELLED",
        "IN_PROGRESS",
        "COMPLETED",
      ],
      default: "PENDING",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const TrainingBooking = model<ITrainingBooking>(
  "TrainingBooking",
  trainingBookingSchema,
  "trainingBookings"
);

export default TrainingBooking;

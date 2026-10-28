import { Schema, model } from "mongoose";

export interface ITrainingSession {
  sessionId: string;
  bookingId: string;
  trainerId: string;
  sessionDate: Date;
  durationMinutes: number;
  activities: string;
  petCondition: string;
  progressPercentage: number;
  trainerNotes?: string;
  nextSessionPlan?: string;
}

const trainingSessionSchema = new Schema<ITrainingSession>(
  {
    sessionId: {
      type: String,
      required: [true, "Session ID is required"],
      unique: true,
      trim: true,
    },

    bookingId: {
      type: String,
      required: [true, "Booking ID is required"],
      trim: true,
      index: true,
    },

    trainerId: {
      type: String,
      required: [true, "Trainer ID is required"],
      trim: true,
    },

    sessionDate: {
      type: Date,
      required: [true, "Session date is required"],
    },

    durationMinutes: {
      type: Number,
      required: [true, "Session duration is required"],
      min: [1, "Session duration must be at least one minute"],
      max: [1440, "Session duration cannot exceed 24 hours"],
    },

    activities: {
      type: String,
      required: [true, "Training activities are required"],
      trim: true,
      maxlength: [2000, "Activities cannot exceed 2000 characters"],
    },

    petCondition: {
      type: String,
      required: [true, "Pet condition is required"],
      trim: true,
      maxlength: [1000, "Pet condition cannot exceed 1000 characters"],
    },

    progressPercentage: {
      type: Number,
      required: [true, "Progress percentage is required"],
      min: [0, "Progress cannot be less than 0"],
      max: [100, "Progress cannot exceed 100"],
    },

    trainerNotes: {
      type: String,
      trim: true,
      maxlength: [2000, "Trainer notes cannot exceed 2000 characters"],
    },

    nextSessionPlan: {
      type: String,
      trim: true,
      maxlength: [2000, "Next session plan cannot exceed 2000 characters"],
    },
  },
  {
    timestamps: true,
  }
);

const TrainingSession = model<ITrainingSession>(
  "TrainingSession",
  trainingSessionSchema,
  "trainingSessions"
);

export default TrainingSession;

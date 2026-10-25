
import { Schema, model } from "mongoose";

export interface ITrainingProgram {
  _id: string;
  name: string;
  animalType: string;
  description: string;
  durationWeeks: number;
  price: number;
  status: "ACTIVE" | "INACTIVE";
}

const trainingProgramSchema = new Schema<ITrainingProgram>(
  {
    _id: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: [true, "Program name is required"],
      trim: true,
    },

    animalType: {
      type: String,
      required: [true, "Animal type is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Program description is required"],
      trim: true,
    },

    durationWeeks: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least one week"],
    },

    price: {
      type: Number,
      required: [true, "Program price is required"],
      min: [0, "Price cannot be negative"],
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

const TrainingProgram = model<ITrainingProgram>(
  "TrainingProgram",
  trainingProgramSchema,
  "trainingPrograms"
);

export default TrainingProgram;

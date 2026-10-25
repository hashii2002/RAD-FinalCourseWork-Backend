
import type { Request, Response } from "express";
import mongoose from "mongoose";

import TrainingProgram from "../models/trainingProgram.model";
import Counter from "../models/counter.model";

export const createTrainingProgram = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    
    const counter = await Counter.findOneAndUpdate(
      { _id: "trainingProgramId" },
      { $inc: { seq: 1 } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    const programId = `TRAIN-${String(counter.seq).padStart(4, "0")}`;

    const program = await TrainingProgram.create({
      ...req.body,
      _id: programId,
    });

    res.status(201).json({
      success: true,
      message: "Training program created successfully",
      data: program,
    });
  } catch (error: unknown) {
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: Object.values(error.errors).map((item) => item.message),
      });
      return;
    }

    if (
      error instanceof mongoose.Error &&
      error.name === "StrictModeError"
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid training program data",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to create training program",
    });
  }
};

export const getAllTrainingPrograms = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const programs = await TrainingProgram.find().sort({ _id: 1 });

    res.status(200).json({
      success: true,
      count: programs.length,
      data: programs,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve training programs",
    });
  }
};

export const getTrainingProgramById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const program = await TrainingProgram.findById(req.params.id);

    if (!program) {
      res.status(404).json({
        success: false,
        message: "Training program not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: program,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve training program",
    });
  }
};

export const updateTrainingProgram = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      animalType,
      description,
      durationWeeks,
      price,
      status,
    } = req.body;

    const updates = {
      name,
      animalType,
      description,
      durationWeeks,
      price,
      status,
    };

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(filteredUpdates).length === 0) {
      res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
      return;
    }

    const program = await TrainingProgram.findByIdAndUpdate(
      req.params.id,
      { $set: filteredUpdates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!program) {
      res.status(404).json({
        success: false,
        message: "Training program not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Training program updated successfully",
      data: program,
    });
  } catch (error: unknown) {
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: Object.values(error.errors).map((item) => item.message),
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to update training program",
    });
  }
};

export const deleteTrainingProgram = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const program = await TrainingProgram.findByIdAndDelete(req.params.id);

    if (!program) {
      res.status(404).json({
        success: false,
        message: "Training program not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Training program deleted successfully",
      data: program,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to delete training program",
    });
  }
};

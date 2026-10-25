
import type { Request, Response } from "express";
import mongoose from "mongoose";

import Pet from "../models/pet.model";
import Counter from "../models/counter.model";

// Create a new pet with a sequential Pet ID
export const createPet = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Atomically increment the Pet ID counter
    const counter = await Counter.findOneAndUpdate(
      { _id: "petId" },
      { $inc: { seq: 1 } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    // Format the ID as PET-0001, PET-0002, etc.
    const petId = `PET-${String(counter.seq).padStart(4, "0")}`;

    // Save the pet using the generated ID
    const pet = await Pet.create({
      ...req.body,
      _id: petId,
    });

    res.status(201).json({
      success: true,
      message: "Pet created successfully",
      data: pet,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to create pet",
    });
  }
};

// Get all pets
export const getAllPets = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const pets = await Pet.find().sort({ _id: 1 });

    res.status(200).json({
      success: true,
      count: pets.length,
      data: pets,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve pets",
    });
  }
};

// Get one pet using its custom ID
export const getPetById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      res.status(404).json({
        success: false,
        message: "Pet not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: pet,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve pet",
    });
  }
};

// Update a pet using its custom ID
export const updatePet = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Only allow these fields to be updated
    const {
      name,
      species,
      breed,
      ageMonths,
      price,
      description,
      imageUrl,
      status,
    } = req.body;

    const updates = {
      name,
      species,
      breed,
      ageMonths,
      price,
      description,
      imageUrl,
      status,
    };

    // Remove fields that were not supplied
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      { $set: filteredUpdates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!pet) {
      res.status(404).json({
        success: false,
        message: "Pet not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Pet updated successfully",
      data: pet,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to update pet",
    });
  }
};

// Delete a pet using its custom ID
export const deletePet = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const pet = await Pet.findByIdAndDelete(req.params.id);

    if (!pet) {
      res.status(404).json({
        success: false,
        message: "Pet not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Pet deleted successfully",
      data: pet,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Failed to delete pet",
    });
  }
};


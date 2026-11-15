import type { Request, Response } from "express";
import mongoose from "mongoose";

import Pet from "../models/pet.model";
import Counter from "../models/counter.model";
import uploadImageToCloudinary from "../services/image-upload.service";

export const createPet = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    let imageUrl = req.body.imageUrl || "";

    if (req.file) {
      imageUrl = await uploadImageToCloudinary(req.file.buffer);
    }

    const counter = await Counter.findOneAndUpdate(
      { _id: "petId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const petId = `PET-${String(counter.seq).padStart(4, "0")}`;

    const pet = await Pet.create({
      ...req.body,
      _id: petId,
      imageUrl,
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

    console.error("Create pet error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create pet",
    });
  }
};

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


export const updatePet = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
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

    const updates: Record<string, unknown> = {
      name,
      species,
      breed,
      ageMonths,
      price,
      description,
      imageUrl,
      status,
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    if (req.file) {
      const uploadedImageUrl = await uploadImageToCloudinary(
        req.file.buffer
      );

      updates.imageUrl = uploadedImageUrl;
    }

    const pet = await Pet.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
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
    console.error("Update Pet Error Details:", error);

    const errorDetails =
      error instanceof Error
        ? error.message
        : JSON.stringify(error, Object.getOwnPropertyNames(error));

    res.status(500).json({
      success: false,
      message: "Failed to update pet",
      error: errorDetails,
    });
  }
};

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


export const searchPets = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      species,
      breed,
      status,
      minPrice,
      maxPrice,
    } = req.query;

    const filter: Record<string, unknown> = {};

    if (typeof name === "string" && name.trim()) {
      filter.name = {
        $regex: name.trim(),
        $options: "i",
      };
    }

    if (typeof species === "string" && species.trim()) {
      filter.species = {
        $regex: species.trim(),
        $options: "i",
      };
    }

    if (typeof breed === "string" && breed.trim()) {
      filter.breed = {
        $regex: breed.trim(),
        $options: "i",
      };
    }

    const validStatuses = ["AVAILABLE", "SOLD", "RESERVED"];

    if (typeof status === "string") {
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          message: "Status must be AVAILABLE, SOLD, or RESERVED",
        });
        return;
      }

      filter.status = status;
    }

    const priceFilter: { $gte?: number; $lte?: number } = {};

    if (minPrice !== undefined) {
      const minimum = Number(minPrice);

      if (
        typeof minPrice !== "string" || minPrice.trim() === "" || !Number.isFinite(minimum) || minimum < 0) {
        res.status(400).json({
          success: false,
          message: "minPrice must be a valid non-negative number",
        });
        return;
      }

      priceFilter.$gte = minimum;
    }

    if (maxPrice !== undefined) {
      const maximum = Number(maxPrice);

      if (
        typeof maxPrice !== "string" ||  maxPrice.trim() === "" || !Number.isFinite(maximum) || maximum < 0) {
        res.status(400).json({
          success: false,
          message: "maxPrice must be a valid non-negative number",
        });
        return;
      }

      priceFilter.$lte = maximum;
    }

    if (
      priceFilter.$gte !== undefined &&
      priceFilter.$lte !== undefined &&
      priceFilter.$gte > priceFilter.$lte
    ) {
      res.status(400).json({
        success: false,
        message: "minPrice cannot be greater than maxPrice",
      });
      return;
    }

    if (Object.keys(priceFilter).length > 0) {
      filter.price = priceFilter;
    }

    const pets = await Pet.find(filter).sort({ _id: 1 });

    res.status(200).json({
      success: true,
      count: pets.length,
      data: pets,
    });
  } catch (error) {
    console.error("Search pets error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to search pets",
    });
  }
};




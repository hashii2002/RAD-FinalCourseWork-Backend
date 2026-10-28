import { Request, Response } from "express";
import PetOrder from "../models/pet-order.model";
import Pet from "../models/pet.model";
import User from "../models/user.model";
import Counter from "../models/counter.model";

export const createPetOrder = async ( req: Request, res: Response): Promise<void> => {
  try {

    const { petId, customerPhone, message } = req.body;

    if (
      typeof petId !== "string" || !petId.trim() || typeof customerPhone !== "string" || !customerPhone.trim()) {
      res.status(400).json({
        success: false,
        message: "Pet ID and customer phone number are required",
      });
      return;
    }

    if (
      message !== undefined && (typeof message !== "string" || message.length > 1000) ) {
      res.status(400).json({
        success: false,
        message: "Message must be a string with a maximum of 1000 characters",
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
        message: "Only customers can submit pet order requests",
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

    const pet = await Pet.findById(petId.trim());

    if (!pet) {
      res.status(404).json({
        success: false,
        message: "Pet was not found",
      });
      return;
    }

    if (pet.status !== "AVAILABLE") {
      res.status(409).json({
        success: false,
        message: "This pet is not currently available for order",
      });
      return;
    }

    const counter = await Counter.findOneAndUpdate(
      { _id: "petOrderId" },
      { $inc: { seq: 1 } },
      {
        returnDocument: "after",
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    if (!counter) {
      throw new Error("Unable to generate pet order ID");
    }

    const orderId = `ORD-${String(counter.seq).padStart(4, "0")}`;

    const petOrder = await PetOrder.create({
      orderId,
      petId: pet._id,
      customerId: customer.userId,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customerPhone.trim(),
      message: typeof message === "string" ? message.trim() : undefined,
      status: "PENDING",
    });

    res.status(201).json({
      success: true,
      message: "Pet order request submitted successfully",
      data: petOrder,
    });
  } catch (error) {
    console.error("Create pet order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to submit pet order request",
    });
  }
};

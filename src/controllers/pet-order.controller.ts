import mongoose from "mongoose";
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

// ------------------- View customer own Orders ----------------------
export const getMyPetOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
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
        message: "Only customers can view their own pet orders",
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

    const orders = await PetOrder.find({
      customerId: customer.userId,
    }).sort({ createdAt: -1 });

    const petIds = orders.map((order) => order.petId);

    const pets = await Pet.find({
      _id: { $in: petIds },
    });

    const petMap = new Map(
      pets.map((pet) => [String(pet._id), pet])
    );

    const ordersWithPetDetails = orders.map((order) => {
      const orderData = order.toObject();
      const relatedPet = petMap.get(String(order.petId));

      return {
        ...orderData,
        pet: relatedPet
          ? {
              _id: relatedPet._id,
              name: relatedPet.name,
              species: relatedPet.species,
              breed: relatedPet.breed,
              ageMonths: relatedPet.ageMonths,
              price: relatedPet.price,
              imageUrl: relatedPet.imageUrl,
              status: relatedPet.status,
            }
          : null,
      };
    });

    res.status(200).json({
      success: true,
      count: ordersWithPetDetails.length,
      data: ordersWithPetDetails,
    });
  } catch (error) {
    console.error("Get customer pet orders error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve customer pet orders",
    });
  }
};

 // ------------------ Retrieve all pet orders for the admin ---------------------------
export const getAllPetOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
  
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Only admins can view all pet orders",
      });
      return;
    }

    const orders = await PetOrder.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "All pet orders retrieved successfully",
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Get all pet orders error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve pet orders",
    });
  }
};


export const updatePetOrderStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  const session = await mongoose.startSession();

  try {
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Only admins can update pet order status",
      });
      return;
    }

    const { orderId } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "PENDING",
      "CONTACTED",
      "APPROVED",
      "REJECTED",
      "CANCELLED",
    ];

    if (!allowedStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid pet order status",
      });
      return;
    }

    let updatedOrder: any = null;
    let errorStatus = 500;

    await session.withTransaction(async () => {

      const order = await PetOrder.findOne({ orderId }).session(session);

      if (!order) {
        errorStatus = 404;
        throw new Error("Pet order not found");
      }

      const previousStatus = order.status;

      if (previousStatus === status) {
        updatedOrder = order;
        return;
      }

      const pet = await Pet.findById(order.petId).session(session);

      if (!pet) {
        errorStatus = 404;
        throw new Error("Related pet not found");
      }

      if (status === "APPROVED") {
        const existingApprovedOrder = await PetOrder.findOne({
          petId: order.petId,
          status: "APPROVED",
          orderId: { $ne: orderId },
        }).session(session);

        if (existingApprovedOrder) {
          errorStatus = 409;
          throw new Error(
            "Another approved order already exists for this pet"
          );
        }

        if (previousStatus !== "APPROVED") {
          if (pet.status !== "AVAILABLE") {
            errorStatus = 409;
            throw new Error(
              "This pet is not available for approval"
            );
          }

          const soldPet = await Pet.findOneAndUpdate(
            {
              _id: order.petId,
              status: "AVAILABLE",
            },
            {
              $set: { status: "SOLD" },
            },
            {
              new: true,
              session,
            }
          );

          if (!soldPet) {
            errorStatus = 409;
            throw new Error(
              "Pet availability changed. Please refresh and try again"
            );
          }
        }
      }

      if (
        previousStatus === "APPROVED" &&
        status !== "APPROVED"
      ) {
        const availablePet = await Pet.findOneAndUpdate(
          {
            _id: order.petId,
            status: "SOLD",
          },
          {
            $set: { status: "AVAILABLE" },
          },
          {
            new: true,
            session,
          }
        );

        if (!availablePet) {
          errorStatus = 409;
          throw new Error(
            "Pet status could not be changed to AVAILABLE"
          );
        }
      }

      updatedOrder = await PetOrder.findOneAndUpdate(
        {
          orderId,
          status: previousStatus,
        },
        {
          $set: { status },
        },
        {
          new: true,
          runValidators: true,
          session,
        }
      );

      if (!updatedOrder) {
        errorStatus = 409;
        throw new Error(
          "Order status changed. Please refresh and try again"
        );
      }
    });

    res.status(200).json({
      success: true,
      message: "Pet order status updated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Update Pet Order Status Error:", error);

    res.status(
      errorStatusForResponse(error, 500)
    ).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update pet order status",
    });
  } finally {
    await session.endSession();
  }
};

function errorStatusForResponse(
  error: unknown,
  defaultStatus: number
): number {
  if (error instanceof Error) {
    if (error.message === "Pet order not found") return 404;
    if (error.message === "Related pet not found") return 404;

    if (
      error.message ===
        "Another approved order already exists for this pet" ||
      error.message === "This pet is not available for approval" ||
      error.message.startsWith("Pet availability changed") ||
      error.message.startsWith("Pet status could not be changed") ||
      error.message.startsWith("Order status changed")
    ) {
      return 409;
    }

    if (error.message === "Invalid pet order status") return 400;
  }

  return defaultStatus;
}





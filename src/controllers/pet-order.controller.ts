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

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
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

// Update a pet order status (Only Admin)
export const updatePetOrderStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
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
      "CONTACTED",
      "APPROVED",
      "REJECTED",
      "CANCELLED",
    ];

    if (
      typeof status !== "string" ||
      !allowedStatuses.includes(status)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
      return;
    }

    const order = await PetOrder.findOne({ orderId });

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Pet order was not found",
      });
      return;
    }

    if (!["PENDING", "CONTACTED"].includes(order.status)) {
      res.status(409).json({
        success: false,
        message: "This order has already been processed",
      });
      return;
    }

    if (status === "APPROVED") {

      const existingApprovedOrder = await PetOrder.findOne({
        petId: order.petId,
        status: "APPROVED",
        orderId: { $ne: order.orderId },
      });

      if (existingApprovedOrder) {
        res.status(409).json({
          success: false,
          message: "Another order for this pet is already approved",
        });
        return;
      }

      const updatedPet = await Pet.findOneAndUpdate(
        {
          _id: order.petId,
          status: "AVAILABLE",
        },
        {
          $set: { status: "SOLD" },
        },
        {
          returnDocument: "after",
        }
      );

      if (!updatedPet) {
        res.status(409).json({
          success: false,
          message: "This pet is no longer available",
        });
        return;
      }

      try {
        const updatedOrder = await PetOrder.findOneAndUpdate(
          {
            orderId,
            status: { $in: ["PENDING", "CONTACTED"] },
          },
          {
            $set: { status: "APPROVED" },
          },
          {
            returnDocument: "after",
            runValidators: true,
          }
        );

        if (!updatedOrder) {
  
          await Pet.findOneAndUpdate(
            { _id: order.petId, status: "SOLD" },
            { $set: { status: "AVAILABLE" } }
          );

          res.status(409).json({
            success: false,
            message: "Order status changed. Please refresh and try again",
          });
          return;
        }

        res.status(200).json({
          success: true,
          message: "Pet order approved successfully",
          data: updatedOrder,
        });
        return;
      } catch (error) {
        await Pet.findOneAndUpdate(
          { _id: order.petId, status: "SOLD" },
          { $set: { status: "AVAILABLE" } }
        );

        throw error;
      }
    }

    const updatedOrder = await PetOrder.findOneAndUpdate(
      {
        orderId,
        status: { $in: ["PENDING", "CONTACTED"] },
      },
      {
        $set: { status },
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!updatedOrder) {
      res.status(409).json({
        success: false,
        message: "Order status changed. Please refresh and try again",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Pet order status updated to ${status}`,
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Update pet order status error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update pet order status",
    });
  }
};




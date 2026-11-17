import { Request, Response } from "express";

import Pet from "../models/pet.model";
import PetOrder from "../models/pet-order.model";
import User from "../models/user.model";

export const generatePetSalesReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Admin Authorization
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Only administrators can access pet sales reports",
      });
      return;
    }

    const admin = await User.findById(req.user.userId);

    if (!admin || !admin.isActive || admin.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Active administrator account not found",
      });
      return;
    }

    // Get approved pet orders
    const orders = await PetOrder.find({
      status: "APPROVED",
    }).sort({ updatedAt: -1 });

    // Get related pets
    const petIds = orders.map((order) => order.petId);

    const pets = await Pet.find({
      _id: { $in: petIds },
    });

    const petMap = new Map(
      pets.map((pet) => [String(pet._id), pet])
    );

    let totalSalesValue = 0;

    // Prepare sales details
    const sales = orders.map((order) => {
      const pet = petMap.get(String(order.petId));

      if (!pet) {
        return {
          orderId: order.orderId,
          petName: "Not Available",
          species: "Not Available",
          breed: "Not Available",
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          saleDate: order.updatedAt,
          petPrice: 0,
        };
      }

      const petPrice = Number(pet.price) || 0;

      totalSalesValue += petPrice;

      return {
        orderId: order.orderId,
        petName: pet.name,
        species: pet.species,
        breed: pet.breed || "Not Specified",
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        saleDate: order.updatedAt,
        petPrice,
      };
    });

    res.status(200).json({
      success: true,
      message: "Pet sales report data retrieved successfully",

      data: {
        summary: {
          totalApprovedOrders: orders.length,
          totalPetsSold: sales.filter(
            (sale) => sale.petPrice > 0
          ).length,
          totalSalesValue,
        },

        sales,

        reportInfo: {
          reportType: "Pet Sales Report",
          orderStatus: "APPROVED",
          generatedBy: "PawPath Administrator",
          generatedAt: new Date(),
        },
      },
    });
  } catch (error) {
    console.error("Generate pet sales report error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve pet sales report data",
      });
    }
  }
};

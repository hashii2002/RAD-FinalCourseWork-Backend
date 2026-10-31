import { Request, Response } from "express";
import Pet from "../models/pet.model";
import PetOrder from "../models/pet-order.model";
import TrainingProgram from "../models/trainingProgram.model";
import TrainingBooking from "../models/training-booking.model";
import Payment from "../models/payment.model";
import User from "../models/user.model";

export const getDashboardAnalytics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {

    if (req.user?.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Only administrators can view dashboard analytics",
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

    const [
      totalPets,
      availablePets,
      soldPets,
      reservedPets,
      totalOrders,
      pendingOrders,
      approvedOrders,
      rejectedOrders,
      totalTrainingPrograms,
      activeTrainingPrograms,
      totalTrainingBookings,
      pendingTrainingBookings,
      approvedTrainingBookings,
      inProgressTrainingBookings,
      completedTrainingBookings,
    ] = await Promise.all([
      Pet.countDocuments(),
      Pet.countDocuments({ status: "AVAILABLE" }),
      Pet.countDocuments({ status: "SOLD" }),
      Pet.countDocuments({ status: "RESERVED" }),

      PetOrder.countDocuments(),
      PetOrder.countDocuments({ status: "PENDING" }),
      PetOrder.countDocuments({ status: "APPROVED" }),
      PetOrder.countDocuments({ status: "REJECTED" }),

      TrainingProgram.countDocuments(),
      TrainingProgram.countDocuments({ status: "ACTIVE" }),

      TrainingBooking.countDocuments(),
      TrainingBooking.countDocuments({ status: "PENDING" }),
      TrainingBooking.countDocuments({ status: "APPROVED" }),
      TrainingBooking.countDocuments({ status: "IN_PROGRESS" }),
      TrainingBooking.countDocuments({ status: "COMPLETED" }),
    ]);

    const [
      totalPayments,
      unpaidPayments,
      partiallyPaidPayments,
      paidPayments,
      refundedPayments,
      activePaymentSummary,
    ] = await Promise.all([
      Payment.countDocuments(),
      Payment.countDocuments({ status: "UNPAID" }),
      Payment.countDocuments({ status: "PARTIALLY_PAID" }),
      Payment.countDocuments({ status: "PAID" }),
      Payment.countDocuments({ status: "REFUNDED" }),

      Payment.aggregate([
      
        { $match: { status: { $ne: "REFUNDED" } } },
        {
          $group: {
            _id: "$paymentType",
            totalPaid: { $sum: "$paidAmount" },
            outstandingBalance: { $sum: "$balance" },
            totalDiscount: { $sum: "$discount" },
            paymentCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const petPaymentSummary = activePaymentSummary.find(
      (item) => item._id === "PET_ORDER"
    );

    const trainingPaymentSummary = activePaymentSummary.find(
      (item) => item._id === "TRAINING_BOOKING"
    );

    const petSalesCollected = petPaymentSummary?.totalPaid ?? 0;
    const trainingFeesCollected = trainingPaymentSummary?.totalPaid ?? 0;

    const totalCollectedRevenue =
      petSalesCollected + trainingFeesCollected;

    const totalOutstandingBalance = activePaymentSummary.reduce(
      (sum, item) => sum + item.outstandingBalance,
      0
    );

    res.status(200).json({
      success: true,
      message: "Dashboard analytics retrieved successfully",
      data: {
        pets: {
          total: totalPets,
          available: availablePets,
          sold: soldPets,
          reserved: reservedPets,
        },
        petOrders: {
          total: totalOrders,
          pending: pendingOrders,
          approved: approvedOrders,
          rejected: rejectedOrders,
        },
        trainingPrograms: {
          total: totalTrainingPrograms,
          active: activeTrainingPrograms,
        },
        trainingBookings: {
          total: totalTrainingBookings,
          pending: pendingTrainingBookings,
          approved: approvedTrainingBookings,
          inProgress: inProgressTrainingBookings,
          completed: completedTrainingBookings,
        },
        payments: {
          total: totalPayments,
          unpaid: unpaidPayments,
          partiallyPaid: partiallyPaidPayments,
          paid: paidPayments,
          refunded: refundedPayments,

          petSalesCollected,
          trainingFeesCollected,
          totalCollectedRevenue,
          totalOutstandingBalance,

          note:
            "Collected amounts exclude payment records marked as REFUNDED.",
        },
      },
    });
  } catch (error) {
    console.error("Get dashboard analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard analytics",
    });
  }
};

import { Request, Response } from "express";
import Pet from "../models/pet.model";
import PetOrder from "../models/pet-order.model";
import TrainingProgram from "../models/trainingProgram.model";
import TrainingBooking from "../models/training-booking.model";
import Payment from "../models/payment.model";
import User from "../models/user.model";

export const generateSystemSummaryReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Admin authorization
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
      return;
    }

    const admin = await User.findById(req.user.userId);

    if (!admin || !admin.isActive || admin.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Active administrator account required.",
      });
      return;
    }
    
    const [
      pets,
      petOrders,
      programs,
      bookings,
      payments,
      users,
    ] = await Promise.all([
      Pet.find(),
      PetOrder.find(),
      TrainingProgram.find(),
      TrainingBooking.find(),
      Payment.find(),
      User.find(),
    ]);

    const petSummary = {
      total: pets.length,
      available: pets.filter(
        (pet) => pet.status === "AVAILABLE"
      ).length,
      sold: pets.filter(
        (pet) => pet.status === "SOLD"
      ).length,
      reserved: pets.filter(
        (pet) => pet.status === "RESERVED"
      ).length,
    };

    const petOrderSummary = {
      total: petOrders.length,
      pending: petOrders.filter(
        (order) => order.status === "PENDING"
      ).length,
      approved: petOrders.filter(
        (order) => order.status === "APPROVED"
      ).length,
      rejected: petOrders.filter(
        (order) => order.status === "REJECTED"
      ).length,
      cancelled: petOrders.filter(
        (order) => order.status === "CANCELLED"
      ).length,
    };

    const trainingProgramSummary = {
      total: programs.length,
      active: programs.filter(
        (program) => program.status === "ACTIVE"
      ).length,
      inactive: programs.filter(
        (program) => program.status === "INACTIVE"
      ).length,
    };

    const trainingBookingSummary = {
      total: bookings.length,
      pending: bookings.filter(
        (booking) => booking.status === "PENDING"
      ).length,
      approved: bookings.filter(
        (booking) => booking.status === "APPROVED"
      ).length,
      rejected: bookings.filter(
        (booking) => booking.status === "REJECTED"
      ).length,
      inProgress: bookings.filter(
        (booking) => booking.status === "IN_PROGRESS"
      ).length,
      completed: bookings.filter(
        (booking) => booking.status === "COMPLETED"
      ).length,
      cancelled: bookings.filter(
        (booking) => booking.status === "CANCELLED"
      ).length,
    };

    const userSummary = {
      total: users.length,
      admins: users.filter(
        (user) => user.role === "ADMIN"
      ).length,
      trainers: users.filter(
        (user) => user.role === "TRAINER"
      ).length,
      customers: users.filter(
        (user) => user.role === "CUSTOMER"
      ).length,
      active: users.filter(
        (user) => user.isActive
      ).length,
      inactive: users.filter(
        (user) => !user.isActive
      ).length,
    };

    const paymentSummary = {
      total: payments.length,
      paid: payments.filter(
        (payment) => payment.status === "PAID"
      ).length,
      partiallyPaid: payments.filter(
        (payment) => payment.status === "PARTIALLY_PAID"
      ).length,
      unpaid: payments.filter(
        (payment) => payment.status === "UNPAID"
      ).length,
      refunded: payments.filter(
        (payment) => payment.status === "REFUNDED"
      ).length,
    };

    // Financial summary
    let totalCollectedRevenue = 0;
    let totalOutstandingBalance = 0;

    payments.forEach((payment) => {
      if (payment.status !== "REFUNDED") {
        totalCollectedRevenue += Number(
          payment.paidAmount || 0
        );

        totalOutstandingBalance += Number(
          payment.balance || 0
        );
      }
    });

    const financialSummary = {
      totalCollectedRevenue,
      totalOutstandingBalance,
    };

    res.status(200).json({
      success: true,
      message: "System summary report data retrieved successfully",

      data: {
        overview: {
          totalUsers: userSummary.total,
          totalPets: petSummary.total,
          totalPetOrders: petOrderSummary.total,
          totalTrainingPrograms: trainingProgramSummary.total,
          totalTrainingBookings: trainingBookingSummary.total,
          totalPaymentRecords: paymentSummary.total,
        },

        petSummary,
        petOrderSummary,
        trainingProgramSummary,
        trainingBookingSummary,
        userSummary,
        paymentSummary,
        financialSummary,

        reportInfo: {
          systemName: "PawPath Pet Sales & Training Management System",
          reportType: "System Summary Report",
          dataSource: "MongoDB Database",
          accessLevel: "Administrator",
          generatedBy: "PawPath Administrator",
          generatedAt: new Date(),
          note: "Refunded payments are excluded from collected revenue and outstanding balances.",
        },
      },
    });
  } catch (error) {
    console.error("System Summary Report Error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve system summary report data.",
      });
    }
  }
};


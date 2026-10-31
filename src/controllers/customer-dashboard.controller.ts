import { Request, Response } from "express";

import User from "../models/user.model";
import PetOrder from "../models/pet-order.model";
import TrainingBooking from "../models/training-booking.model";
import TrainingSession from "../models/training-session.model";
import Payment from "../models/payment.model";

export const getCustomerDashboard = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {

    if (req.user?.role !== "CUSTOMER") {
      res.status(403).json({
        success: false,
        message: "Only customers can access the customer dashboard",
      });
      return;
    }

    const customer = await User.findById(req.user.userId);

    if (!customer || !customer.isActive || customer.role !== "CUSTOMER") {
      res.status(403).json({
        success: false,
        message: "Active customer account not found",
      });
      return;
    }

    const customerId = customer.userId;

    const [orders, bookings, payments] = await Promise.all([
      PetOrder.find({ customerId }).sort({ createdAt: -1 }),

      TrainingBooking.find({ customerId }).sort({ createdAt: -1 }),

      Payment.find({ customerId }).sort({ createdAt: -1 }),
    ]);

    const bookingIds = bookings.map((booking) => booking.bookingId);

    const sessions =
      bookingIds.length > 0
        ? await TrainingSession.find({
            bookingId: { $in: bookingIds },
          }).sort({ sessionDate: -1 })
        : [];

    const orderSummary = {
      total: orders.length,
      pending: orders.filter((item) => item.status === "PENDING").length,
      approved: orders.filter((item) => item.status === "APPROVED").length,
      rejected: orders.filter((item) => item.status === "REJECTED").length,
      cancelled: orders.filter((item) => item.status === "CANCELLED").length,
    };

    const trainingSummary = {
      total: bookings.length,
      pending: bookings.filter((item) => item.status === "PENDING").length,
      approved: bookings.filter((item) => item.status === "APPROVED").length,
      inProgress: bookings.filter((item) => item.status === "IN_PROGRESS")
        .length,
      completed: bookings.filter((item) => item.status === "COMPLETED").length,
      rejected: bookings.filter((item) => item.status === "REJECTED").length,
      cancelled: bookings.filter((item) => item.status === "CANCELLED").length,
      totalSessions: sessions.length,
    };

    const activePayments = payments.filter(
      (payment) => payment.status !== "REFUNDED"
    );

    const paymentSummary = {
      totalRecords: payments.length,
      unpaid: payments.filter((item) => item.status === "UNPAID").length,
      partiallyPaid: payments.filter(
        (item) => item.status === "PARTIALLY_PAID"
      ).length,
      paid: payments.filter((item) => item.status === "PAID").length,
      refunded: payments.filter((item) => item.status === "REFUNDED").length,

      totalPaid: Number(
        activePayments.reduce((sum, item) => sum + item.paidAmount, 0).toFixed(2)
      ),

      totalOutstandingBalance: Number(
        activePayments.reduce((sum, item) => sum + item.balance, 0).toFixed(2)
      ),
    };

    res.status(200).json({
      success: true,
      message: "Customer dashboard retrieved successfully",
      data: {
        customer: {
          userId: customer.userId,
          name: customer.name,
          email: customer.email,
        },
        summary: {
          orders: orderSummary,
          training: trainingSummary,
          payments: paymentSummary,
        },
        orders,
        trainingBookings: bookings,
        trainingSessions: sessions,
        payments,
      },
    });
  } catch (error) {
    console.error("Get customer dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve customer dashboard",
    });
  }
};
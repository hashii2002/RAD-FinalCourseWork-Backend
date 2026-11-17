import { Request, Response } from "express";

import Payment from "../models/payment.model";
import User from "../models/user.model";

export const generatePaymentReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Admin Authorization
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Only administrators can access payment reports",
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

    // Get All Payment Records
    const payments = await Payment.find().sort({
      createdAt: -1,
    });

    // Get Customer Details
    const customerIds = [
      ...new Set(payments.map((payment) => payment.customerId)),
    ];

    const customers = await User.find({
      userId: { $in: customerIds },
    });

    const customerMap = new Map(
      customers.map((customer) => [customer.userId, customer])
    );

    // Payment Summary
    const summary = {
      total: payments.length,
      paid: 0,
      partiallyPaid: 0,
      unpaid: 0,
      refunded: 0,
    };

    // Financial Summary
    let totalPetSalesCollected = 0;
    let totalTrainingFeesCollected = 0;
    let totalOutstandingBalance = 0;

    payments.forEach((payment) => {
      switch (payment.status) {
        case "PAID":
          summary.paid++;
          break;

        case "PARTIALLY_PAID":
          summary.partiallyPaid++;
          break;

        case "UNPAID":
          summary.unpaid++;
          break;

        case "REFUNDED":
          summary.refunded++;
          break;
      }

      if (payment.status !== "REFUNDED") {
        const paidAmount = Number(payment.paidAmount || 0);
        const balance = Number(payment.balance || 0);

        if (payment.paymentType === "PET_ORDER") {
          totalPetSalesCollected += paidAmount;
        }

        if (payment.paymentType === "TRAINING_BOOKING") {
          totalTrainingFeesCollected += paidAmount;
        }

        totalOutstandingBalance += balance;
      }
    });

    const totalCollectedRevenue =
      totalPetSalesCollected + totalTrainingFeesCollected;

    // Prepare Payment Details
    const paymentDetails = payments.map((payment) => {
      const customer = customerMap.get(payment.customerId);

      return {
        paymentId: payment.paymentId,
        paymentType: payment.paymentType,
        referenceId: payment.referenceId,

        customerId: payment.customerId,
        customerName: customer?.name || "Not Available",

        paymentDate: payment.createdAt,

        totalAmount: Number(payment.totalAmount || 0),
        discount: Number(payment.discount || 0),
        finalAmount: Number(payment.finalAmount || 0),
        paidAmount: Number(payment.paidAmount || 0),
        balance: Number(payment.balance || 0),

        status: payment.status,

        transactions: payment.transactions.map((transaction) => ({
          transactionId: transaction.transactionId,
          amount: Number(transaction.amount || 0),
          paymentMethod: transaction.paymentMethod,
          paymentDate: transaction.paymentDate,
          referenceNumber: transaction.referenceNumber || "",
          receivedBy: transaction.receivedBy,
          notes: transaction.notes || "",
          refundedBy: transaction.refundedBy || "",
          refundedAt: transaction.refundedAt,
          refundReason: transaction.refundReason || "",
        })),
      };
    });

    res.status(200).json({
      success: true,
      message: "Payment report data retrieved successfully",

      data: {
        summary,

        financialSummary: {
          totalPetSalesCollected,
          totalTrainingFeesCollected,
          totalCollectedRevenue,
          totalOutstandingBalance,
        },

        payments: paymentDetails,

        reportInfo: {
          reportType: "Payment Management Report",
          generatedBy: "PawPath Administrator",
          generatedAt: new Date(),
        },
      },
    });
  } catch (error) {
    console.error("Generate payment report error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve payment report data",
      });
    }
  }
};

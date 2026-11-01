import { Request, Response } from "express";
import Payment from "../models/payment.model";
import User from "../models/user.model";
import { generatePDF } from "../services/pdf-generator.service";

const formatCurrency = (amount: number): string => {
  return `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const generatePaymentReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {

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

    const payments = await Payment.find().sort({
      createdAt: -1,
    });

    if (payments.length === 0) {
      generatePDF(
        res,
        "PawPath-Payment-Report.pdf",
        "Payment Management Report",
        [
          "## Payment Summary",
          "Total Payment Records: 0",
          "Total Collected Revenue: LKR 0.00",
          "Outstanding Balance: LKR 0.00",
          "",
          "No payment records were found.",
        ]
      );
      return;
    }

    const customerIds = [
      ...new Set(payments.map((payment) => payment.customerId)),
    ];

    const customers = await User.find({
      userId: { $in: customerIds },
    });

    const customerMap = new Map(
      customers.map((customer) => [
        customer.userId,
        customer,
      ])
    );

    const summary = {
      total: payments.length,
      paid: 0,
      partiallyPaid: 0,
      unpaid: 0,
      refunded: 0,
    };

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

    const content: string[] = [];

    content.push("## Payment Summary");
    content.push(`Total Payment Records: ${summary.total}`);
    content.push(`Paid Payments: ${summary.paid}`);
    content.push(`Partially Paid Payments: ${summary.partiallyPaid}`);
    content.push(`Unpaid Payments: ${summary.unpaid}`);
    content.push(`Refunded Payments: ${summary.refunded}`);
    content.push("");
    content.push("## Financial Summary");
    content.push(`Pet Sales Payments Collected: ${formatCurrency( totalPetSalesCollected)}` );
    content.push( `Training Fees Collected: ${formatCurrency( totalTrainingFeesCollected)}`);
    content.push(`Total Collected Revenue: ${formatCurrency( totalCollectedRevenue)}`);
    content.push(`Total Outstanding Balance: ${formatCurrency( totalOutstandingBalance)}`);
    content.push("");
    content.push("## Payment Details");

    payments.forEach((payment, index) => {
      const customer = customerMap.get(payment.customerId);

      const paymentDate = (payment as any).createdAt
        ? new Date((payment as any).createdAt).toLocaleDateString()
        : "Not Available";

      content.push("");
      content.push(`Payment ${index + 1}: ${payment.paymentId}`);

      content.push(`Payment Type: ${payment.paymentType}`);
      content.push(`Reference ID: ${payment.referenceId}`);

      content.push(
        `Customer: ${customer?.name || "Not Available"}`
      );

      content.push(`Customer ID: ${payment.customerId}`);
      content.push(`Payment Date: ${paymentDate}`);

      content.push(
        `Total Amount: ${formatCurrency(Number(payment.totalAmount || 0))}`
      );

      content.push(
        `Discount: ${formatCurrency(Number(payment.discount || 0))}`
      );

      content.push(
        `Final Amount: ${formatCurrency(Number(payment.finalAmount || 0))}`
      );

      content.push(
        `Paid Amount: ${formatCurrency(Number(payment.paidAmount || 0))}`
      );

      content.push(
        `Outstanding Balance: ${formatCurrency(Number(payment.balance || 0))}`
      );

      content.push(`Payment Status: ${payment.status}`);
    });

    content.push("");
    content.push("## Report Information");
    content.push("Report Type: Payment Management Report");
    content.push("Generated By: PawPath Administrator");

    generatePDF(
      res,
      "PawPath-Payment-Report.pdf",
      "Payment Management Report",
      content
    );
  } catch (error) {
    console.error("Generate payment report error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to generate payment report",
      });
    }
  }
};

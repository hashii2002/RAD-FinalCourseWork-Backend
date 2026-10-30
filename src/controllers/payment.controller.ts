import { Request, Response } from "express";

import Payment from "../models/payment.model";
import PetOrder from "../models/pet-order.model";
import Pet from "../models/pet.model";
import TrainingBooking from "../models/training-booking.model";
import TrainingProgram from "../models/trainingProgram.model";
import User from "../models/user.model";
import Counter from "../models/counter.model";

const calculatePayment = (
  totalAmount: number,
  discount: number,
  paidAmount: number
) => {
  const finalAmount = Number((totalAmount - discount).toFixed(2));
  const balance = Number((finalAmount - paidAmount).toFixed(2));

  let status: "UNPAID" | "PARTIALLY_PAID" | "PAID";

  if (paidAmount === 0) {
    status = "UNPAID";
  } else if (balance === 0) {
    status = "PAID";
  } else {
    status = "PARTIALLY_PAID";
  }

  return {
    finalAmount,
    paidAmount,
    balance,
    status,
  };
};

const isValidMoney = (value: unknown): value is number => {
  return (
    typeof value === "number" && Number.isFinite(value) && value >= 0);
};

export const createPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Only administrators can create payment records",
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

    const { paymentType, referenceId, discount = 0 } = req.body;

    if (
      !["PET_ORDER", "TRAINING_BOOKING"].includes(paymentType) ||
      typeof referenceId !== "string" ||
      !referenceId.trim()
    ) {
      res.status(400).json({
        success: false,
        message: "Valid payment type and reference ID are required",
      });
      return;
    }

    if (!isValidMoney(discount)) {
      res.status(400).json({
        success: false,
        message: "Discount must be a valid non-negative number",
      });
      return;
    }

    let customerId: string;
    let totalAmount: number;

    if (paymentType === "PET_ORDER") {
      const order = await PetOrder.findOne({
        orderId: referenceId.trim(),
      });

      if (!order) {
        res.status(404).json({
          success: false,
          message: "Pet order not found",
        });
        return;
      }

      if (order.status !== "APPROVED") {
        res.status(400).json({
          success: false,
          message: "Payment can only be created for an approved pet order",
        });
        return;
      }

      const pet = await Pet.findById(order.petId);

      if (!pet) {
        res.status(404).json({
          success: false,
          message: "Related pet not found",
        });
        return;
      }

      customerId = order.customerId;
      totalAmount = pet.price;
    } else {
      const booking = await TrainingBooking.findOne({
        bookingId: referenceId.trim(),
      });

      if (!booking) {
        res.status(404).json({
          success: false,
          message: "Training booking not found",
        });
        return;
      }

      if (
        booking.status !== "APPROVED" &&
        booking.status !== "IN_PROGRESS"
      ) {
        res.status(400).json({
          success: false,
          message: "Payment can only be created for an approved training booking",
        });
        return;
      }

      const program = await TrainingProgram.findById(
        booking.trainingProgramId
      );

      if (!program) {
        res.status(404).json({
          success: false,
          message: "Related training program not found",
        });
        return;
      }

      customerId = booking.customerId;
      totalAmount = program.price;
    }

    const existingPayment = await Payment.findOne({
      paymentType,
      referenceId: referenceId.trim(),
    });

    if (existingPayment) {
      res.status(409).json({
        success: false,
        message: "A payment record already exists for this order or booking",
      });
      return;
    }

    if (discount > totalAmount) {
      res.status(400).json({
        success: false,
        message: "Discount cannot exceed the total amount",
      });
      return;
    }

    const counter = await Counter.findOneAndUpdate(
      { _id: "paymentId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const paymentId = `PAY-${String(counter.seq).padStart(4, "0")}`;

    const calculated = calculatePayment(totalAmount, discount, 0);

    const payment = await Payment.create({
      paymentId,
      paymentType,
      referenceId: referenceId.trim(),
      customerId,
      totalAmount,
      discount,
      ...calculated,
      transactions: [],
    });

    res.status(201).json({
      success: true,
      message: "Payment record created successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Create payment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create payment record",
    });
  }
};

export const getAllPayments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Only administrators can view all payment records",
      });
      return;
    }

    const payments = await Payment.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error("Get all payments error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve payment records",
    });
  }
};

export const getMyPayments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (req.user?.role !== "CUSTOMER") {
      res.status(403).json({
        success: false,
        message: "Only customers can view their own payments",
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

    const payments = await Payment.find({
      customerId: customer.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error("Get customer payments error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve customer payments",
    });
  }
};

export const getPaymentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const payment = await Payment.findOne({
      paymentId: req.params.paymentId,
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
      return;
    }

    if (req.user?.role === "ADMIN") {
      const admin = await User.findById(req.user.userId);

      if (!admin || !admin.isActive || admin.role !== "ADMIN") {
        res.status(403).json({
          success: false,
          message: "Active administrator account not found",
        });
        return;
      }
    } else if (req.user?.role === "CUSTOMER") {
      const customer = await User.findById(req.user.userId);

      if (
        !customer ||
        !customer.isActive ||
        customer.role !== "CUSTOMER" ||
        customer.userId !== payment.customerId
      ) {
        res.status(403).json({
          success: false,
          message: "You are not allowed to view this payment",
        });
        return;
      }
    } else {
      res.status(403).json({
        success: false,
        message: "You are not allowed to view this payment",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("Get payment by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve payment details",
    });
  }
};

export const updatePayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Only administrators can update payment records",
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

    const { discount } = req.body;

    if (!isValidMoney(discount)) {
      res.status(400).json({
        success: false,
        message: "A valid non-negative discount is required",
      });
      return;
    }

    const payment = await Payment.findOne({
      paymentId: req.params.paymentId,
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
      return;
    }

    if (payment.status === "REFUNDED") {
      res.status(400).json({
        success: false,
        message: "Refunded payment records cannot be updated",
      });
      return;
    }

    if (discount > payment.totalAmount) {
      res.status(400).json({
        success: false,
        message: "Discount cannot exceed the total amount",
      });
      return;
    }

    const newFinalAmount = payment.totalAmount - discount;

    if (newFinalAmount < payment.paidAmount) {
      res.status(400).json({
        success: false,
        message: "Discount cannot make the final amount lower than the amount already paid",
      });
      return;
    }

    payment.discount = discount;

    const calculated = calculatePayment(
      payment.totalAmount,
      discount,
      payment.paidAmount
    );

    payment.finalAmount = calculated.finalAmount;
    payment.balance = calculated.balance;
    payment.status = calculated.status;

    await payment.save();

    res.status(200).json({
      success: true,
      message: "Payment discount updated successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Update payment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update payment record",
    });
  }
};

export const addPaymentTransaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Only administrators can record payments",
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

    const {
      amount,
      paymentMethod,
      paymentDate,
      referenceNumber,
      notes,
    } = req.body;

    if (
      !isValidMoney(amount) ||
      amount <= 0 ||
      !["CASH", "BANK_TRANSFER", "OTHER"].includes(paymentMethod)
    ) {
      res.status(400).json({
        success: false,
        message: "Valid payment amount and payment method are required",
      });
      return;
    }

    const parsedPaymentDate = paymentDate
      ? new Date(paymentDate)
      : new Date();

    if (Number.isNaN(parsedPaymentDate.getTime())) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid payment date",
      });
      return;
    }

    const payment = await Payment.findOne({
      paymentId: req.params.paymentId,
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
      return;
    }

    if (payment.status === "REFUNDED") {
      res.status(400).json({
        success: false,
        message: "Cannot add transactions to a refunded payment",
      });
      return;
    }

    if (amount > payment.balance) {
      res.status(400).json({
        success: false,
        message: `Payment amount cannot exceed the outstanding balance of ${payment.balance}`,
      });
      return;
    }

    const counter = await Counter.findOneAndUpdate(
      { _id: "paymentTransactionId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const transactionId = `PTX-${String(counter.seq).padStart(4, "0")}`;

    payment.transactions.push({
      transactionId,
      amount,
      paymentMethod,
      paymentDate: parsedPaymentDate,
      referenceNumber,
      receivedBy: admin.userId,
      notes,
    });

    const paidAmount = payment.transactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );

    const calculated = calculatePayment(
      payment.totalAmount,
      payment.discount,
      Number(paidAmount.toFixed(2))
    );

    payment.paidAmount = calculated.paidAmount;
    payment.finalAmount = calculated.finalAmount;
    payment.balance = calculated.balance;
    payment.status = calculated.status;

    await payment.save();

    res.status(201).json({
      success: true,
      message: "Payment transaction recorded successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Add payment transaction error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to record payment transaction",
    });
  }
};

export const deletePayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Only administrators can refund payment records",
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

    const payment = await Payment.findOne({
      paymentId: req.params.paymentId,
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
      return;
    }

    if (payment.status === "REFUNDED") {
      res.status(400).json({
        success: false,
        message: "This payment has already been refunded",
      });
      return;
    }

    payment.status = "REFUNDED";

    await payment.save();

    res.status(200).json({
      success: true,
      message: "Payment record marked as refunded successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Refund payment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to refund payment record",
    });
  }
};

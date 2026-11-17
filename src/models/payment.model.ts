import { Schema, model } from "mongoose";

export type PaymentType = "PET_ORDER" | "TRAINING_BOOKING";

export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "OTHER";

export type PaymentStatus =
  | "UNPAID"
  | "PARTIALLY_PAID"
  | "PAID"
  | "REFUNDED";

// payment transaction details
export interface IPaymentTransaction {
  transactionId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  referenceNumber?: string;
  receivedBy: string;
  notes?: string;
  refundedBy?: string;
  refundedAt?: Date;
  refundReason?: string;
}

// Main payment record
export interface IPayment {
  paymentId: string;
  paymentType: PaymentType;
  referenceId: string;
  customerId: string;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paidAmount: number;
  balance: number;
  status: PaymentStatus;
  transactions: IPaymentTransaction[];
  createdAt?: Date;
  updatedAt?: Date;
}

const transactionSchema = new Schema<IPaymentTransaction>(
  {
    transactionId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, "Payment amount must be greater than zero"],
    },
    paymentMethod: {
      type: String,
      enum: ["CASH", "BANK_TRANSFER", "OTHER"],
      required: true,
    },
    paymentDate: {
      type: Date,
      required: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
    },
    receivedBy: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
  },
  { _id: false }
);

const paymentSchema = new Schema<IPayment>(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    paymentType: {
      type: String,
      enum: ["PET_ORDER", "TRAINING_BOOKING"],
      required: true,
    },
    referenceId: {
      type: String,
      required: true,
      trim: true,
    },
    customerId: {
      type: String,
      required: true,
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },
    finalAmount: {
      type: Number,
      required: true,
      min: [0, "Final amount cannot be negative"],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, "Paid amount cannot be negative"],
    },
    balance: {
      type: Number,
      required: true,
      min: [0, "Balance cannot be negative"],
    },
    status: {
      type: String,
      enum: ["UNPAID", "PARTIALLY_PAID", "PAID","REFUNDED"],
      default: "UNPAID",
    },
    transactions: {
      type: [transactionSchema],
      default: [],
    },
  },
  { timestamps: true }
);

paymentSchema.index(
  { paymentType: 1, referenceId: 1 },
  { unique: true }
);

const Payment = model<IPayment>(
  "Payment",
   paymentSchema,
  "payments"
);

export default Payment;


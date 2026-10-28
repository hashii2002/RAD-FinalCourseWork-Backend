
import { Schema, model } from "mongoose";

export interface IPetOrder {
  orderId: string;
  petId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  message?: string;
  status: "PENDING" | "CONTACTED" | "APPROVED" | "REJECTED" | "CANCELLED";
}

const petOrderSchema = new Schema<IPetOrder>(
  {
    orderId: {
      type: String,
      required: [true, "Order ID is required"],
      unique: true,
      trim: true,
    },

    petId: {
      type: String,
      required: [true, "Pet ID is required"],
      trim: true,
    },

    customerId: {
      type: String,
      required: [true, "Customer ID is required"],
      trim: true,
    },

    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      minlength: [2, "Customer name must contain at least 2 characters"],
      maxlength: [100, "Customer name cannot exceed 100 characters"],
    },

    customerEmail: {
      type: String,
      required: [true, "Customer email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },

    customerPhone: {
      type: String,
      required: [true, "Customer phone number is required"],
      trim: true,
      minlength: [7, "Phone number is too short"],
      maxlength: [20, "Phone number cannot exceed 20 characters"],
    },

    message: {
      type: String,
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },

    status: {
      type: String,
      enum: ["PENDING", "CONTACTED", "APPROVED", "REJECTED", "CANCELLED"],
      default: "PENDING",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const PetOrder = model<IPetOrder>(
  "PetOrder",
  petOrderSchema,
  "petOrders"
);

export default PetOrder;

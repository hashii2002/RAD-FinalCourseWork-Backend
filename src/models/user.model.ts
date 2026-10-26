
import { Schema, model } from "mongoose";

export interface IUser {
  userId: string;
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "TRAINER" | "CUSTOMER";
  isActive: boolean;
}

const userSchema = new Schema<IUser>(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      trim: true,
    },

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must contain at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },

    role: {
      type: String,
      enum: ["ADMIN", "TRAINER", "CUSTOMER"],
      default: "CUSTOMER",
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { userId: { $type: "string" } },
  }
);

const User = model<IUser>("User", userSchema, "users");

export default User;


import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import connectDB from "../config/db";
import User from "../models/user.model";

const createAdmin = async (): Promise<void> => {
  try {
    const name = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!name || !email || !password) {
      throw new Error(
        "ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be set in .env"
      );
    }

    if (password.length < 8) {
      throw new Error(
        "Admin password must contain at least 12 characters"
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new Error(
        "An account with this email already exists. No changes were made."
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
    });

    console.log("Administrator account created successfully.");
    console.log(`Admin ID: ${String(admin._id)}`);
    console.log(`Admin email: ${admin.email}`);
    console.log(`Admin role: ${admin.role}`);
  } catch (error) {
    console.error(
      "Failed to create administrator:",
      error instanceof Error ? error.message : error
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

void createAdmin();

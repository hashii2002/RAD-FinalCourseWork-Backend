import "dotenv/config";
import mongoose from "mongoose";

import connectDB from "../config/db";
import User from "../models/user.model";
import Counter from "../models/counter.model";
import { generateUserId, UserRole } from "../utils/userId.util";

const validRoles: UserRole[] = ["ADMIN", "TRAINER", "CUSTOMER"];

const migrateUserIds = async (): Promise<void> => {
  try {
    await connectDB();
    const users = await User.find().sort({ createdAt: 1 });

    console.log(`Total users found: ${users.length}`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      if (user.userId && user.userId.trim() !== "") {
        skippedCount++;
        continue;
      }

      if (!validRoles.includes(user.role)) {
        console.error(
          `Skipping user ${String(user._id)} because the role is invalid.`
        );
        continue;
      }

      const newUserId = await generateUserId(user.role);

      await User.updateOne(
        { _id: user._id },
        { $set: { userId: newUserId } }
      );

      updatedCount++;
      console.log(`Assigned ${newUserId} to ${user.email}`);
    }

    console.log("\nUser ID migration completed.");
    console.log(`Users updated: ${updatedCount}`);
    console.log(`Users skipped: ${skippedCount}`);
  } catch (error) {
    console.error(
      "User ID migration failed:",
      error instanceof Error ? error.message : error
    );
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

void migrateUserIds();

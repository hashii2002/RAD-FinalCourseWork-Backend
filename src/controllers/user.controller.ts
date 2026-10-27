import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.model";
import { generateUserId, UserRole } from "../utils/userId.util";

const validRoles: UserRole[] = ["ADMIN", "TRAINER", "CUSTOMER"];

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Get all users error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve users",
    });
  }
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findOne({
      userId: req.params.id,
    }).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve user",
    });
  }
};

export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    if (
      typeof name !== "string" ||!name.trim() ||
      typeof email !== "string" ||!email.trim() ||
      typeof password !== "string" ||!password
    ) {
      res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters",
      });
      return;
    }

    if (!validRoles.includes(role as UserRole)) {
      res.status(400).json({
        success: false,
        message: "Role must be ADMIN, TRAINER, or CUSTOMER",
      });
      return;
    }

    const selectedRole = role as UserRole;
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "This email is already registered",
      });
      return;
    }

    const userId = await generateUserId(selectedRole);
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      userId,
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: selectedRole,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        userId: user.userId,
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    if (
      typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      res.status(409).json({
        success: false,
        message: "This email or User ID is already registered",
      });
      return;
    }

    console.error("Create user error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, role, isActive } = req.body;
    const existingUser = await User.findOne({
      userId: req.params.id,
    });

    if (!existingUser) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const updates: {
      name?: string;
      email?: string;
      role?: UserRole;
      userId?: string;
      isActive?: boolean;
    } = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        res.status(400).json({
          success: false,
          message: "Name must be a non-empty string",
        });
        return;
      }

      updates.name = name.trim();
    }

    if (email !== undefined) {
      if (typeof email !== "string" || !email.trim()) {
        res.status(400).json({
          success: false,
          message: "Email must be a non-empty string",
        });
        return;
      }

      updates.email = email.trim().toLowerCase();
    }

    if (role !== undefined) {
      if (!validRoles.includes(role as UserRole)) {
        res.status(400).json({
          success: false,
          message: "Role must be ADMIN, TRAINER, or CUSTOMER",
        });
        return;
      }

      const newRole = role as UserRole;
      updates.role = newRole;

      if (newRole !== existingUser.role) {
        updates.userId = await generateUserId(newRole);
      }
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        res.status(400).json({
          success: false,
          message: "isActive must be true or false",
        });
        return;
      }

      updates.isActive = isActive;
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({
        success: false,
        message: "At least one supported field is required",
      });
      return;
    }

    const user = await User.findOneAndUpdate(
      { userId: req.params.id },
      { $set: updates },
      {
        returnDocument: "after",
        runValidators: true,
      }
    ).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    if (
      typeof error === "object" &&  error !== null &&  "code" in error &&  error.code === 11000) {
      res.status(409).json({
        success: false,
        message: "This email or User ID is already registered",
      });
      return;
    }

    console.error("Update user error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

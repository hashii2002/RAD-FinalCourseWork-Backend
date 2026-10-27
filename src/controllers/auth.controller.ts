import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import { AuthenticatedUser } from "../middleware/auth.middleware";
import { generateUserId } from "../utils/userId.util";
import crypto from "crypto";
import nodemailer from "nodemailer";

// Register Part
export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
      return;
    }

    if (typeof password !== "string" || password.length < 8) {
      res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters",
      });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
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

    
  const hashedPassword = await bcrypt.hash(password, 12);

  // Generate a unique ID for the new customer.
  const userId = await generateUserId("CUSTOMER");

  const user = await User.create({
    userId,
    name: String(name).trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: "CUSTOMER",
  });

  res.status(201).json({
    success: true,
    message: "Customer registered successfully",
    data: {
      id: String(user._id),
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });

  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to register customer",
    });
  }
};

//Login Part
export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: "This account is inactive",
      });
      return;
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET is missing from the .env file");
    }

    const token = jwt.sign(
      {
        userId: String(user._id),
        role: user.role,
      },
      jwtSecret,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: String(user._id),
          userId: user.userId,
          name: user.name,
          email: user.email,
          role: user.role,
        },

      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to log in",
    });
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = req.user as AuthenticatedUser;

    const user = await User.findById(authenticatedUser.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: "This account is inactive",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      data: {
        id: String(user._id),
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve user profile",
    });
  }
};

export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authenticatedUser = req.user as AuthenticatedUser;
    const { currentPassword, newPassword } = req.body;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      !currentPassword ||
      !newPassword
    ) {
      res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        message: "New password must contain at least 8 characters",
      });
      return;
    }

    if (currentPassword === newPassword) {
      res.status(400).json({
        success: false,
        message: "New password must be different from the current password",
      });
      return;
    }

    const user = await User.findById(
      authenticatedUser.userId
    ).select("+password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: "This account is inactive",
      });
      return;
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!passwordMatches) {
      res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
      return;
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};


 //---------------------- Forgot Password ----------------------
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (typeof email !== "string" || !email.trim()) {
      res.status(400).json({
        success: false,
        message: "Email is required",
      });
      return;
    }

    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_APP_PASSWORD;
    const frontendUrl = process.env.FRONTEND_URL;

    if (!emailUser || !emailPassword || !frontendUrl) {
      console.error("Password reset email configuration is incomplete");

      res.status(500).json({
        success: false,
        message: "Password reset service is not configured",
      });
      return;
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user || !user.isActive) {
      res.status(200).json({
        success: true,
        message:
          "If an active account exists for this email, a reset link will be sent.",
      });
      return;
    }
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    const resetLink =
      `${frontendUrl.replace(/\/$/, "")}/reset-password?token=${resetToken}`;

    try {
      await transporter.sendMail({
        from: `"PawPath" <${emailUser}>`,
        to: user.email,
        subject: "PawPath Password Reset",
        text: [
          `Hello ${user.name},`,
          "",
          "We received a request to reset your PawPath password.",
          `Open this link to reset your password: ${resetLink}`,
          "",
          "This link expires in 15 minutes.",
          "If you did not request this, you can ignore this email.",
        ].join("\n"),
      });
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      console.error("Password reset email error:", emailError);

      res.status(500).json({
        success: false,
        message: "Unable to send the password reset email",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message:
        "If an active account exists for this email, a reset link will be sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to process the password reset request",
    });
  }
};

//----------------------------- Reset Password --------------------------------
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!token || typeof token !== "string" || typeof newPassword !== "string") {
      res.status(400).json({
        success: false,
        message: "Reset token and new password are required",
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        message: "New password must contain at least 8 characters",
      });
      return;
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
      isActive: true,
    }).select("+password +resetPasswordToken +resetPasswordExpires");

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Reset token is invalid or has expired",
      });
      return;
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully. Please log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to reset password",
    });
  }
};



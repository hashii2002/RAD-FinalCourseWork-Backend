import { Request, Response } from "express";
import Pet from "../models/pet.model";
import PetOrder from "../models/pet-order.model";
import TrainingProgram from "../models/trainingProgram.model";
import TrainingBooking from "../models/training-booking.model";
import Payment from "../models/payment.model";
import User from "../models/user.model";
import { generatePDF } from "../services/pdf-generator.service";

const formatCurrency = (amount: number): string => {
  return `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const generateSystemSummaryReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
   
    if (req.user?.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
      return;
    }

    const admin = await User.findById(req.user.userId);

    if (!admin || !admin.isActive || admin.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Active administrator account required.",
      });
      return;
    }

    const [
      pets,
      petOrders,
      programs,
      bookings,
      payments,
      users,
    ] = await Promise.all([
      Pet.find(),
      PetOrder.find(),
      TrainingProgram.find(),
      TrainingBooking.find(),
      Payment.find(),
      User.find(),
    ]);

    // Pet statistics
    const totalPets = pets.length;
    const availablePets = pets.filter(
      (pet) => pet.status === "AVAILABLE"
    ).length;
    const soldPets = pets.filter(
      (pet) => pet.status === "SOLD"
    ).length;
    const reservedPets = pets.filter(
      (pet) => pet.status === "RESERVED"
    ).length;

    // Pet order statistics
    const totalOrders = petOrders.length;
    const pendingOrders = petOrders.filter(
      (order) => order.status === "PENDING"
    ).length;
    const approvedOrders = petOrders.filter(
      (order) => order.status === "APPROVED"
    ).length;
    const rejectedOrders = petOrders.filter(
      (order) => order.status === "REJECTED"
    ).length;
    const cancelledOrders = petOrders.filter(
      (order) => order.status === "CANCELLED"
    ).length;

    // Training program statistics
    const totalPrograms = programs.length;
    const activePrograms = programs.filter(
      (program) => program.status === "ACTIVE"
    ).length;
    const inactivePrograms = programs.filter(
      (program) => program.status === "INACTIVE"
    ).length;

    // Training booking statistics
    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(
      (booking) => booking.status === "PENDING"
    ).length;
    const approvedBookings = bookings.filter(
      (booking) => booking.status === "APPROVED"
    ).length;
    const rejectedBookings = bookings.filter(
      (booking) => booking.status === "REJECTED"
    ).length;
    const inProgressBookings = bookings.filter(
      (booking) => booking.status === "IN_PROGRESS"
    ).length;
    const completedBookings = bookings.filter(
      (booking) => booking.status === "COMPLETED"
    ).length;
    const cancelledBookings = bookings.filter(
      (booking) => booking.status === "CANCELLED"
    ).length;

    // User statistics
    const totalUsers = users.length;
    const totalAdmins = users.filter(
      (user) => user.role === "ADMIN"
    ).length;
    const totalTrainers = users.filter(
      (user) => user.role === "TRAINER"
    ).length;
    const totalCustomers = users.filter(
      (user) => user.role === "CUSTOMER"
    ).length;
    const activeUsers = users.filter(
      (user) => user.isActive
    ).length;
    const inactiveUsers = users.filter(
      (user) => !user.isActive
    ).length;

    // Payment statistics
    const totalPayments = payments.length;
    const paidPayments = payments.filter(
      (payment) => payment.status === "PAID"
    ).length;
    const partiallyPaidPayments = payments.filter(
      (payment) => payment.status === "PARTIALLY_PAID"
    ).length;
    const unpaidPayments = payments.filter(
      (payment) => payment.status === "UNPAID"
    ).length;
    const refundedPayments = payments.filter(
      (payment) => payment.status === "REFUNDED"
    ).length;


    let totalCollectedRevenue = 0;
    let totalOutstandingBalance = 0;

    payments.forEach((payment) => {
      if (payment.status !== "REFUNDED") {
        totalCollectedRevenue += Number(payment.paidAmount || 0);
        totalOutstandingBalance += Number(payment.balance || 0);
      }
    });

    const content: string[] = [
      "## System Overview",
      `Report Generated: ${new Date().toLocaleString()}`,
      `Total Registered Users: ${totalUsers}`,
      `Total Pets: ${totalPets}`,
      `Total Pet Orders: ${totalOrders}`,
      `Total Training Programs: ${totalPrograms}`,
      `Total Training Bookings: ${totalBookings}`,
      `Total Payment Records: ${totalPayments}`,
      "",

      "CARD: Total Pets | " + String(totalPets),
      "CARD: Total Pet Orders | " + String(totalOrders),
      "CARD: Training Bookings | " + String(totalBookings),
      "CARD: Collected Revenue | " + formatCurrency(totalCollectedRevenue),
      "CARD: Outstanding Balance | " + formatCurrency(totalOutstandingBalance),
      
      "## Pet Summary",
      `Total Pets: ${totalPets}`,
      `Available Pets: ${availablePets}`,
      `Sold Pets: ${soldPets}`,
      `Reserved Pets: ${reservedPets}`,
      "",
      "## Pet Orders Summary",
      `Total Orders: ${totalOrders}`,
      `Pending Orders: ${pendingOrders}`,
      `Approved Orders: ${approvedOrders}`,
      `Rejected Orders: ${rejectedOrders}`,
      `Cancelled Orders: ${cancelledOrders}`,
      "",
      "## Training Programs Summary",
      `Total Programs: ${totalPrograms}`,
      `Active Programs: ${activePrograms}`,
      `Inactive Programs: ${inactivePrograms}`,
      "",
      "## Training Bookings Summary",
      `Total Bookings: ${totalBookings}`,
      `Pending Bookings: ${pendingBookings}`,
      `Approved Bookings: ${approvedBookings}`,
      `Rejected Bookings: ${rejectedBookings}`,
      `In Progress Bookings: ${inProgressBookings}`,
      `Completed Bookings: ${completedBookings}`,
      `Cancelled Bookings: ${cancelledBookings}`,
      "",
      "## User Summary",
      `Total Users: ${totalUsers}`,
      `Administrators: ${totalAdmins}`,
      `Trainers: ${totalTrainers}`,
      `Customers: ${totalCustomers}`,
      `Active Users: ${activeUsers}`,
      `Inactive Users: ${inactiveUsers}`,
      "",
      "## Payment Summary",
      `Total Payment Records: ${totalPayments}`,
      `Paid Payments: ${paidPayments}`,
      `Partially Paid Payments: ${partiallyPaidPayments}`,
      `Unpaid Payments: ${unpaidPayments}`,
      `Refunded Payments: ${refundedPayments}`,
      "",
      "## Financial Summary",
      `Total Collected Revenue: ${formatCurrency(totalCollectedRevenue)}`,
      `Total Outstanding Balance: ${formatCurrency(totalOutstandingBalance)}`,
      "",
      "## Report Information",
      "System: PawPath Pet Sales & Training Management System",
      "Report Type: System Summary",
      "Data Source: MongoDB Database",
      "Access Level: Administrator",
      "",
      "This report summarizes the current system records.",
      "Refunded payments are excluded from collected revenue and outstanding balances.",
    ];

    generatePDF(
      res,
      "PawPath-System-Summary-Report.pdf",
      "System Summary Report",
      content
    );
  } catch (error) {
    console.error("System Summary Report Error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to generate System Summary PDF report.",
      });
    }
  }
};

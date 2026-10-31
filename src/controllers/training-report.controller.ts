import { Request, Response } from "express";
import TrainingBooking from "../models/training-booking.model";
import TrainingProgram from "../models/trainingProgram.model";
import TrainingSession from "../models/training-session.model";
import User from "../models/user.model";
import { generatePDF } from "../services/pdf-generator.service";

export const generateTrainingReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {

    if (req.user?.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Only administrators can access training reports",
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

    const bookings = await TrainingBooking.find().sort({
      appointmentDate: -1,
    });

    if (bookings.length === 0) {
      generatePDF(
        res,
        "PawPath-Training-Report.pdf",
        "Training Report",
        [
          "## Training Summary",
          "Total Training Bookings: 0",
          "",
          "No training bookings were found.",
        ]
      );
      return;
    }

    const bookingIds = bookings.map((booking) => booking.bookingId);

    const programIds = [
      ...new Set(bookings.map((booking) => booking.trainingProgramId)),
    ];

    const userIds = [
      ...new Set(
        bookings.flatMap((booking) =>
          [booking.customerId, booking.trainerId].filter(
            (id): id is string => Boolean(id)
          )
        )
      ),
    ];

    const [programs, users, sessions] = await Promise.all([
      TrainingProgram.find({
        _id: { $in: programIds },
      }),

      User.find({
        userId: { $in: userIds },
      }),

      TrainingSession.find({
        bookingId: { $in: bookingIds },
      }).sort({ sessionDate: -1 }),
    ]);

    const programMap = new Map(
      programs.map((program) => [program._id, program])
    );

    const userMap = new Map(
      users.map((user) => [user.userId, user])
    );

    const summary = {
      total: bookings.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      inProgress: 0,
      completed: 0,
    };

    bookings.forEach((booking) => {
      switch (booking.status) {
        case "PENDING":
          summary.pending++;
          break;
        case "APPROVED":
          summary.approved++;
          break;
        case "REJECTED":
          summary.rejected++;
          break;
        case "CANCELLED":
          summary.cancelled++;
          break;
        case "IN_PROGRESS":
          summary.inProgress++;
          break;
        case "COMPLETED":
          summary.completed++;
          break;
      }
    });

    const averageProgress = bookings.length > 0 ? Number((
              bookings.reduce((total, booking) =>
                  total + booking.progressPercentage,0) / bookings.length).toFixed(2)): 0;

    const totalTrainingMinutes = sessions.reduce(
      (total, session) => total + session.durationMinutes,0
    );

    const content: string[] = [];

    content.push("## Training Summary");
    content.push(`Total Bookings: ${summary.total}`);
    content.push(`Pending Bookings: ${summary.pending}`);
    content.push(`Approved Bookings: ${summary.approved}`);
    content.push(`In Progress Bookings: ${summary.inProgress}`);
    content.push(`Completed Bookings: ${summary.completed}`);
    content.push(`Rejected Bookings: ${summary.rejected}`);
    content.push(`Cancelled Bookings: ${summary.cancelled}`);
    content.push(`Average Training Progress: ${averageProgress}%`);
    content.push(`Total Training Sessions: ${sessions.length}`);
    content.push(`Total Training Duration: ${totalTrainingMinutes} minutes`);
    content.push("");
    content.push("## Training Booking Details");

    bookings.forEach((booking, index) => {
      const program = programMap.get(booking.trainingProgramId);
      const customer = userMap.get(booking.customerId);
      const trainer = booking.trainerId ? userMap.get(booking.trainerId) : undefined;

      content.push("");
      content.push(`Booking ${index + 1}: ${booking.bookingId}`);
      content.push(`Status: ${booking.status}`);
      content.push( `Training Program: ${program?.name || "Not Available"}`);
      content.push( `Customer: ${customer?.name || "Not Available"}`);
      content.push(`Customer ID: ${booking.customerId}`);
      content.push(`Trainer: ${trainer?.name || "Not Assigned"}`);
      content.push( `Trainer ID: ${booking.trainerId || "Not Assigned"}`);
      content.push(`Pet Name: ${booking.petName}`);
      content.push(`Species: ${booking.species}`);
      content.push(`Breed: ${booking.breed}`);
      content.push(`Age: ${booking.ageMonths} months`);
      content.push(`Appointment Date: ${new Date(booking.appointmentDate).toLocaleDateString()}`);
      content.push(`Appointment Time: ${booking.appointmentTime}`);
      content.push(`Start Date: ${ booking.startDate? new Date(booking.startDate).toLocaleDateString(): "Not Started"}`);
      content.push(`Expected End Date: ${booking.expectedEndDate ? new Date(booking.expectedEndDate).toLocaleDateString() : "Not Specified" }`);
      content.push( `Actual End Date: ${ booking.actualEndDate ? new Date(booking.actualEndDate).toLocaleDateString() : "Not Completed" }`);
      content.push(`Initial Condition: ${booking.initialCondition}`);
      content.push( `Current Condition: ${booking.currentCondition || "Not Updated" }`);
      content.push(`Training Progress: ${booking.progressPercentage}%`);

      const bookingSessions = sessions.filter(
        (session) => session.bookingId === booking.bookingId
      );

      content.push(`Total Sessions: ${bookingSessions.length}`);

      bookingSessions.forEach((session, sessionIndex) => {
        content.push( `Session ${sessionIndex + 1}: ${new Date( session.sessionDate).toLocaleDateString()}`);
        content.push( `Duration: ${session.durationMinutes} minutes`);
        content.push(`Activities: ${session.activities}`);
        content.push(`Pet Condition: ${session.petCondition}`);
        content.push( `Progress: ${session.progressPercentage}%` );

        if (session.trainerNotes) {
          content.push(`Trainer Notes: ${session.trainerNotes}`);
        }

        if (session.nextSessionPlan) {
          content.push(
            `Next Session Plan: ${session.nextSessionPlan}`
          );
        }
      });
    });

    content.push("");
    content.push("## Report Information");
    content.push("Report Type: Training Management Report");
    content.push("Generated By: PawPath Administrator");

    generatePDF(
      res,
      "PawPath-Training-Report.pdf",
      "Training Management Report",
      content
    );
  } catch (error) {
    console.error("Generate training report error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to generate training report",
      });
    }
  }
};

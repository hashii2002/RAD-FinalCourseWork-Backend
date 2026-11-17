import "dotenv/config";
import express from "express";
import cors from "cors";

import healthRoutes from "./routes/health.routes";
import petRoutes from "./routes/pet.routes";
import trainingProgramRoutes from "./routes/trainingProgram.routes";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import petOrderRoutes from "./routes/pet-order.routes";
import companyContactRoutes from "./routes/company-contact.routes";
import trainingBookingRoutes from "./routes/training-booking.routes";
import trainingSessionRoutes from "./routes/training-session.routes";
import analyticsRoutes from "./routes/analytics.routes";
import paymentRoutes from "./routes/payment.routes";
import customerDashboardRoutes from "./routes/customer-dashboard.routes";
import trainerDashboardRoutes from "./routes/trainer-dashboard.routes";
import petSalesReportRoutes from "./routes/pet-sales-report.routes";
import trainingReportRoutes from "./routes/training-report.routes";
import paymentReportRoutes from "./routes/payment-report.routes";
import systemSummaryReportRoutes from "./routes/system-summary-report.routes";

import connectDB from "./config/db";

const app = express();

// CORS Configuration
app.use(
  cors({
    origin: [
      "https://rad-final-project-frontend-kc13xzzhb-hashiniemalsha06-3367.vercel.app", 
      "https://rad-final-project-frontend-pr511rw1s-hashiniemalsha06-3367.vercel.app",
      "http://localhost:5173", // Vite/React default port
      "http://localhost:3000"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// MongoDB Connection Middleware
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

// API Routes
app.use("/api", healthRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/training-programs", trainingProgramRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/pet-orders", petOrderRoutes);
app.use("/api/company-contact", companyContactRoutes);
app.use("/api/training-bookings", trainingBookingRoutes);
app.use("/api/training-sessions", trainingSessionRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/customer-dashboard", customerDashboardRoutes);
app.use("/api/trainer-dashboard", trainerDashboardRoutes);
app.use("/api/reports", petSalesReportRoutes);
app.use("/api/reports", trainingReportRoutes);
app.use("/api/reports", paymentReportRoutes);
app.use("/api/reports", systemSummaryReportRoutes);

export default app;

if (process.env.NODE_ENV !== "production") {
  const PORT = Number(process.env.PORT) || 3000;

  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`PawPath server is running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error("Failed to start server:", error);
    });
}
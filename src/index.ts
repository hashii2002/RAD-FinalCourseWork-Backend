import "dotenv/config";
import express from "express";
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
import connectDB from "./config/db";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

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

const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`PawPath server is running on port ${PORT}`);
  });
};
startServer();
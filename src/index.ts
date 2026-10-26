import "dotenv/config";
import express from "express";
import healthRoutes from "./routes/health.routes";
import petRoutes from "./routes/pet.routes";
import trainingProgramRoutes from "./routes/trainingProgram.routes";
import authRoutes from "./routes/auth.routes";
import connectDB from "./config/db";
import "dotenv/config";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

app.use("/api", healthRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/training-programs", trainingProgramRoutes);
app.use("/api/auth", authRoutes);


const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`PawPath server is running on port ${PORT}`);
  });
};
startServer();
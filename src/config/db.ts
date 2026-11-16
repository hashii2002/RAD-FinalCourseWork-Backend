import mongoose from "mongoose";
import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

let cached = {
  connection: null as typeof mongoose | null,
  promise: null as Promise<typeof mongoose> | null,
};

const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    throw new Error("MONGODB_URI environment variable is missing");
  }

  if (cached.connection && mongoose.connection.readyState === 1) {
    return;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoURI);
  }

  try {
    cached.connection = await cached.promise;
    console.log("MongoDB connected successfully");
  } catch (error) {
    cached.promise = null;
    cached.connection = null;

    console.error("MongoDB connection failed:", error);
    throw error;
  }
};

export default connectDB;

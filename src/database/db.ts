import mongoose from "mongoose";
import { env } from "../config/env";

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.mongoUrl);
    console.log("Connected to Database");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

export default connectDB;

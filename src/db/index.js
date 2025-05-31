import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log("mongose connected host", connectionInstance.connection.host);
  } catch (error) {
    console.log("modoDB connection failed error", error);
    process.exit(1);
  }
};

export default connectDB;

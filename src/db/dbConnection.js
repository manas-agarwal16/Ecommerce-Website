import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connected = await mongoose.connect(`${process.env.MONGODB_KEY}`);
    console.log("db connected successfully");
  } catch (error) {
    console.log("error in connecting to db");
    throw error;
  }
};

export {connectDB};
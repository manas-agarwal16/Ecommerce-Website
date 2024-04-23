import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    require: true,
  },
  username: {
    type: String,
    require: true,
    unique: true,
  },
  password: {
    type: String,
    require: true,
  },
  email: {
    type: String,
    require: true,
  },
  address: {
    type: String,
    require: true,
  },
  phnNo: {
    type : Number,
    require : true,
  },
  refreshToken: {
    type: String,
    default: undefined,
  },
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.isCorrectPassword = async function (password) {
  try {
    const result = await bcrypt.compare(password, this.password);
    return result; //bool
  } catch (error) {
    throw new ApiError(501, "error in comparing passwords");
  }
};

userSchema.methods.generateAccessToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      email: this.email,
    },
    process.env.ACCESSTOKEN_KEY,
    { expiresIn: process.env.ACCESSTOKENEXPIRY }
  );
};

userSchema.methods.generateRefreshToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESHTOKEN_KEY,
    { expiresIn: process.env.REFRESHTOKENEXPIRY }
  );
};

export const User = mongoose.model("User", userSchema);

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const deliveryBoySchema = new mongoose.Schema({
  fullName: {
    type: String,
    require: true,
  },
  email: {
    type: String,
    require: true,
  },
  phnNo: {
    type: Number,
    require: true,
  },
  password: {
    type: String,
    require: true,
  },
  registerStatus : {
    type : String,
    enum : ["pending","verified"],
    default : "pending"
  },
  status: {
    type: String,
    default: "active",
    enum: ["active", "onDelivery", "onBreak"],
  },
  refreshToken : {
    type : String,
    default : "",
  },
  OTP : {
    type : Number,
    default : null
  }
});

deliveryBoySchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

deliveryBoySchema.methods.isCorrectPassword = async function (password) {
  try {
    const result = await bcrypt.compare(password, this.password);
    return result; //bool
  } catch (error) {
    throw new ApiError(501, "error in comparing passwords");
  }
};

deliveryBoySchema.methods.generateAccessToken = async function () {
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

deliveryBoySchema.methods.generateRefreshToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESHTOKEN_KEY,
    { expiresIn: process.env.REFRESHTOKENEXPIRY }
  );
};

export const DeliveryBoy = mongoose.model("DeliveryBoy", deliveryBoySchema);

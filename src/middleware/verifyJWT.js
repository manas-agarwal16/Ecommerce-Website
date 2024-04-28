import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/users.model.js";
import { DeliveryBoy } from "../models/deliveryBoy.model.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
  const { accessToken } = req.cookies;
  if (!accessToken) {
    throw new ApiError(401, "Invalid request");
  }

  const decodedToken = await jwt.verify(
    accessToken,
    process.env.ACCESSTOKEN_KEY
  );

  console.log(decodedToken);
  if (!decodedToken) {
    throw new ApiError(501, "error in decoding token");
  }

  const user_id = decodedToken._id;

  const user = await User.findById({ _id: user_id });

  if (!user) {
    throw new ApiError(401, "invalid request, user not found");
  }

  req.user = user;
  next();
});

const verifyJWTDeliveryBoy = asyncHandler(async (req, res, next) => {
  const { accessToken } = req.cookies;
  if (!accessToken) {
    throw new ApiError(401, "Invalid request");
  }

  const decodedToken = await jwt.verify(
    accessToken,
    process.env.ACCESSTOKEN_KEY
  );

  console.log(decodedToken);
  if (!decodedToken) {
    throw new ApiError(501, "error in decoding token");
  }

  const deliveryBoy_id = decodedToken._id;

  const deliveryBoy = await DeliveryBoy.findById({ _id: deliveryBoy_id });

  if (!deliveryBoy) {
    throw new ApiError(401, "invalid request, deliveryBoy not found");
  }

  req.deliveryBoy = deliveryBoy;
  next();
});

export {verifyJWT , verifyJWTDeliveryBoy};

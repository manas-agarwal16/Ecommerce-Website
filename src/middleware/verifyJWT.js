import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/users.model.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
  const { accessToken } = req.cookies;
  if (!accessToken) {
    throw new ApiError(401, "Invalid request");
  }

  const decodedToken = await jwt.verify(
    "accessToken",
    process.env.ACCESSTOKEN_KEY
  );

  if (!decodedToken) {
    throw new ApiError(501, "error in decoding token");
  }

  const user_id = decodedToken._id;

  const user = await User.findOneById({ _id: user._id });

  if (!user) {
    throw new ApiError(401, "invalid request, user not found");
  }

  req.user = user;
  next();
});

export {verifyJWT};

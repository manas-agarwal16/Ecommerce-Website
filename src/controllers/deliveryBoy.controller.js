import { DeliveryBoy } from "../models/deliveryBoy.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const registerDeliveryBoy = asyncHandler(async (req, res) => {
  const { fullName, email, phnNo, password } = req.body;
  if (!fullName || !email || !phnNo) {
    throw new ApiError(401, "all fields required");
  }

  let newDeliveryBoY = new DeliveryBoy({
    fullName,
    email,
    phnNo,
    password,
  });

  let existedDeliveryBoy = await DeliveryBoy.find({ email }); //returns array
  if (existedDeliveryBoy.length !== 0) {
    throw new ApiError(409, "email already exists");
  }

  newDeliveryBoY = await newDeliveryBoY.save().then(() => {
    console.log("You are registered as delivery Boy successfully");
    res.status(201).json(
      new ApiResponse(
        201,
        newDeliveryBoY,
        "You r registered as delivery boy successfully!"
      )
    );
  });
});

const loginDeliveryBoy = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  console.log(req.body);
  if (!email || !password) {
    throw new ApiError(400, "All fields are required.");
  }

  const deliveryBoy = await DeliveryBoy.findOne({ email }); //find on the basis of username or email.

  if (!deliveryBoy) {
    throw new ApiError(400, "email is not registered yet");
  }

  const validPassword = await deliveryBoy.isCorrectPassword(password); // user references to the user's document
  if (!validPassword) {
    throw new ApiError(400, "wrong password!!! try again");
  }

  const accessToken = await deliveryBoy.generateAccessToken();
  const refreshToken = await deliveryBoy.generateRefreshToken();

  if (!accessToken) {
    throw new ApiError(500, "error in creating access token");
  }
  if (!refreshToken) {
    throw new ApiError(500, "error in creating refresh token");
  }
  const result = await DeliveryBoy.findOneAndUpdate(
    { email },
    { refreshToken: refreshToken },
    { new: true }
  );
  if (!result) {
    throw new ApiError(501, "error in saving refreshToken to db");
  }
  const options = {
    httpOnly: true, // only server can access cookie not client side.
    secure: true, // cookie is set over secure and encrypted connections.
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options) // Set/create a cookie named "AccessToken" with the provided value and options
    .cookie("refreshToken", refreshToken, options) // Set a cookie named "RefreshToken" with the provided value and options
    .json(
      new ApiResponse(
        201,
        {
          result,
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
        "user has logged in successfully"
      )
    );
});



export { registerDeliveryBoy, loginDeliveryBoy };

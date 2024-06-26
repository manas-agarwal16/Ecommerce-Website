import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/users.model.js"; // User has all access to DB.
import bcrypt from "bcrypt";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { generateOTP, sendOTPThroughEmail } from "../utils/OTP.js";

const registerUser = asyncHandler(async (req, res) => {
  const { email, fullName, password, address, phnNo } = req.body;

  if (
    !fullName ||
    email === "" ||
    password === "" ||
    address === "" ||
    !phnNo
  ) {
    throw new ApiError(400, "All fields are required");
  }

  let existedUser = await User.find({ email }); //returns array
  if (existedUser.length !== 0) {
    throw new ApiError(409, "email already exists");
  }

  const OTP = generateOTP();

  await sendOTPThroughEmail(email, OTP)
    .then(() => {
      console.log("email sent successfully");
    })
    .catch((err) => {
      throw new ApiError(401, "Invalid Email address");
    });

  const user = new User({
    fullName,
    address,
    phnNo,
    email: email.toLowerCase(),
    password,
    OTP: OTP,
  });

  await user
    .save()
    .then(() => {
      console.log("successfully user saved in db");
    })
    .catch((err) => {
      throw new ApiError(501, "error is saving user to db", err);
    });

  const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();

  const updateRefreshToken = await User.findByIdAndUpdate(
    { _id: user._id },
    { refreshToken: refreshToken }
  );

  if (!updateRefreshToken) {
    throw new ApiError(501, "error in updating refreshToken");
  }
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, user, "Enter the OTP for Email verification!"));
});

const sendOTP = asyncHandler(async (req, res) => {
  const OTP = generateOTP();
  const user = req.user;
  const update = await User.findByIdAndUpdate({ _id: user._id }, { OTP: OTP });
  if (!update) {
    throw new ApiError(401, "user not found");
  }
  // console.log(user.email);
  const result = sendOTPThroughEmail(user.email, OTP);

  if (!result) {
    throw new ApiError(401, "email address is invalid or does not exists");
  }

  res.status(201).json(new ApiResponse(201, "OTP has sent to your email"));
});

const verifyOTP = asyncHandler(async (req, res) => {
  const { OTP } = req.body;
  const user = req.user;
  // console.log(OTP);

  if (!OTP) {
    throw new ApiError(401, "OTP is required");
  }

  const dbOTP = user.OTP;

  if (!dbOTP) {
    throw new ApiError(401, "invalid request");
  }

  if (dbOTP !== OTP) {
    return res.status(201).json(new ApiResponse(201, "wrong OTP"));
  }

  const resetOTP = await User.findByIdAndUpdate(
    { _id: user._id },
    { $set: { OTP: null, status: "verified" } },
    { new: true }
  );
  if (!resetOTP) {
    throw new ApiError(501, "error in reseting OTP");
  }

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        "OTP verified successfully , you are registered successfully!!"
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "All fields are required.");
  }

  const user = await User.findOne({ email }); //find on the basis of username or email.

  if (!user) {
    throw new ApiError(400, "username or email is not registered yet");
  }

  if (user.status === "pending") {
    const deleteUser = await User.findByIdAndDelete({ _id: user._id });
    if (!deleteUser) {
      throw new ApiError(501, "error in deleting user");
    }
    throw new ApiError(401, "OTP verification was failed. Register again");
  }

  const validPassword = await user.isCorrectPassword(password); // user references to the user's document
  if (!validPassword) {
    throw new ApiError(400, "wrong password!!! try again");
  }

  const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();

  if (!accessToken) {
    throw new ApiError(500, "error in creating access token");
  }
  if (!refreshToken) {
    throw new ApiError(500, "error in creating refresh token");
  }

  const result = await User.findOneAndUpdate(
    { email },
    { refreshToken: refreshToken }
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
          email: email,
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
        "user has logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  const result = await User.findOneAndUpdate(
    { _id: _id },
    { refreshToken: undefined }
  );

  if (!result) {
    throw new ApiError(501, "error in deleting refreshToken from user's db");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse(
        201,
        { username: req.user?.username },
        `${req.user?.username} has logged out successfully`
      )
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  console.log(incomingRefreshToken);
  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }
  //decoding incoming refresh token.
  const decodedIncomingRefreshToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_KEY
  );
  if (!decodedIncomingRefreshToken) {
    throw new ApiError(501, "error in decoding refresh token");
  }
  const user = await User.findOne({ _id: decodedIncomingRefreshToken._id });
  if (!user) {
    throw new ApiError(401, "Invalid refreshToken");
  }
  const dbRefreshToken = user.refreshToken;
  if (!dbRefreshToken) {
    throw new ApiError(401, "user has logged out already!!!");
  }
  if (incomingRefreshToken !== dbRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }
  const newAccessToken = await user.generateAccessToken();
  const newRefreshToken = await user.generateRefreshToken();

  console.log("newAcessToken: ", newAccessToken);
  if (!newAccessToken) {
    throw new ApiError(501, "error is generating accessToken");
  }
  if (!newRefreshToken) {
    throw new ApiError(501, "error in generating refresh token");
  }
  user.refreshToken = newRefreshToken;
  user.save({ validateBeforeSave: false });
  const options = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(201)
    .cookie("accessToken", newAccessToken, options) //AccessToken cookie's value will get replaced by newAccessToken.
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ApiResponse(
        201,
        {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          username: user.username,
        },
        "accesstoken is refreshed successfully!!!"
      )
    );
});

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  let { oldPassword, newPassword } = req.body;
  console.log(req.body);
  if (!newPassword || !oldPassword) {
    throw new ApiError(401, "enter your passwords");
  }

  const user = req.user;
  console.log(user);

  let currentUserPassword = await User.findOne({ _id: user._id });
  currentUserPassword = currentUserPassword.password;
  console.log(currentUserPassword);

  const validOldPassword = await bcrypt.compare(
    oldPassword,
    currentUserPassword
  );
  console.log(validOldPassword);

  if (!validOldPassword) {
    throw new ApiError(401, "wrong old password");
  }
  const newHashPassword = await bcrypt.hash(newPassword, 10);

  if (!newHashPassword) {
    throw new ApiError(501, "error in hashing password");
  }
  user.password = newHashPassword;
  await user.save({ validateBeforeSave: false });

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { email: user.email },
        "your password has being changed successfully!!"
      )
    );
});

const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(401, "all fields are required");
  }

  const user = req.user;

  if (!user) {
    throw new ApiError(401, "unauthorized request");
  }

  user.fullName = fullName;
  user.email = email;
  user.save({ validateBeforeSave: false });

  return res
    .status(210)
    .json(
      new ApiResponse(
        201,
        { fullName, email },
        "details have been updatedd successfully!!"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updateUserDetails,
  changeCurrentUserPassword,
  sendOTP,
  verifyOTP,
};

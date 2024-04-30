import { DeliveryBoy } from "../models/deliveryBoy.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Order } from "../models/order.model.js";
import { DeliveryBoyOrder } from "../models/deliveryBoyOrder.model.js";
import { assignToDeliveryBoy } from "../utils/AssignToDeliveryBoy.js";

const registerDeliveryBoy = asyncHandler(async (req, res) => {
  
  const { fullName, email, phnNo, password } = req.body;
  if (!fullName || !email || !phnNo || !password)  {
    throw new ApiError(401, "all fields required");
  }

  let existedDeliveryBoy = await DeliveryBoy.find({ email }); //returns array
  if (existedDeliveryBoy.length !== 0) {
    throw new ApiError(409, "email already exists");
  }

  let newDeliveryBoY = new DeliveryBoy({
    fullName,
    email,
    phnNo,
    password,
  });

  await newDeliveryBoY.save().then(() => {
    console.log("You are registered as delivery Boy successfully");
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          newDeliveryBoY,
          "You r registered as delivery boy successfully!"
        )
      );
  }).catch(err => {
    throw new ApiError(501,"error in registering delivery boy.");
  })
});

const sendOTP = asyncHandler(async (req, res) => {
  const OTP = generateOTP();
  console.log(OTP);
  const deliveryBoy = req.deliveryBoy;
  const update = await DeliveryBoy.findByIdAndUpdate({ _id: deliveryBoy._id }, { OTP: OTP });
  if (!update) {
    throw new ApiError(401, "user not found");
  }
  console.log(deliveryBoy.email);
  const result = sendOTPThroughEmail(deliveryBoy.email, OTP);
  if (!result) {
    throw new ApiError(401, "email address is invalid or does not exists");
  }

  res.status(201).json(new ApiResponse(201, "OTP has sent to your email"));
});

const verifyOTP = asyncHandler(async (req, res) => {
  const { OTP } = req.body;
  const deliveryBoy = req.deliveryBoy;
  console.log(OTP);

  if (!OTP) {
    throw new ApiError(401, "OTP is required");
  }

  const dbOTP = deliveryBoy.OTP;

  if (!dbOTP) {
    throw new ApiError(401, "invalid request");
  }

  if (dbOTP !== OTP) {
    return res.status(201).json(new ApiResponse(201, "wrong OTP"));
  }

  const resetOTP = await deliveryBoy.findByIdAndUpdate(
    { _id: deliveryBoy._id },
    { OTP: null },
    { new: true }
  );
  if (!resetOTP) {
    throw new ApiError(501, "error in reseting OTP");
  }

  res.status(201).json(new ApiResponse(201, "OTP verified successfully"));
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

const orderComplete = asyncHandler(async (req, res) => {
  const deliveryBoy = req.deliveryBoy;
  if (!deliveryBoy) {
    throw new ApiError(401, "invalid request");
  }

  const deletePlacedOrder = await DeliveryBoyOrder.findOneAndDelete({
    deliveryBoy_id: deliveryBoy._id,
  });

  if (!deletePlacedOrder) {
    throw new ApiError(501, "error in deleting placed order from database");
  }

  const updateStatus = await DeliveryBoy.findOneAndUpdate(
    { _id: deliveryBoy._id },
    { status: "active" },
    { new: true }
  );

  console.log(updateStatus);
  if (!updateStatus) {
    throw new ApiError(501, "error in updating status of deliveryBoy");
  }

  const pendingOrder = await Order.findOne({ orderStatus: "pending" });

  if (pendingOrder) {
    const delivery = await assignToDeliveryBoy(pendingOrder._id);
    console.log(delivery);
    if (delivery === "Ordered assigned to delivery Boy successfully") {
      const updateStatusToPlaced = await Order.findByIdAndUpdate(
        { _id: pendingOrder._id },
        { orderStatus: "placed" },
        { new: true }
      );
      console.log(updateStatusToPlaced);
      if (!updateStatusToPlaced) {
        throw new ApiError(501, "error in updating status of order to placed.");
      }
    }
    const updateDBoyStatus = await DeliveryBoy.findOneAndUpdate(
      { _id: deliveryBoy._id },
      { status: "onDelivery" },
      { new: true }
    );
    if (!updateDBoyStatus) {
      throw new ApiError(501, "error in updating status of delivery boy");
    }
  }
  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        "your message has been successfully received. Check if there are new orders else Enjoy!!"
      )
    );
});

const myDeliveryOrders = asyncHandler(async (req, res) => {
  const deliveryBoy = req.deliveryBoy;
  if (!deliveryBoy) {
    throw new ApiError(401, "invalid request");
  }
  const yourOrder = await DeliveryBoyOrder.aggregate([
    {
      $match: {
        deliveryBoy_id: deliveryBoy._id,
      },
    },
    {
      $lookup: {
        from: "orders",
        localField: "order_id",
        foreignField: "_id",
        as: "yourOrder",
        pipeline: [
          {
            $project: {
              user_id: 1,
              product_id: 1,
              quantity: 1,
              address: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$yourOrder",
    },
    {
      $lookup: {
        from: "products",
        foreignField: "_id",
        localField: "yourOrder.product_id",
        as: "product",
        pipeline: [
          {
            $project: {
              productName: 1,
              companyName: 1,
              category: 1,
              price: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$product",
    },
    {
      $lookup: {
        from: "users",
        localField: "yourOrder.user_id",
        foreignField: "_id",
        as: "user",
        pipeline: [
          {
            $project: {
              fullName: 1,
              email: 1,
              phnNo: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$user",
    },
    {
      $project: {
        "yourOrder.user_id": 0,
        "yourOrder.product_id": 0,
      },
    },
  ]);
  console.log(yourOrder);
  res
    .status(201)
    .json(
      new ApiResponse(201, yourOrder, "delivery boy order fetched successfully")
    );
});
 

export {
  registerDeliveryBoy,
  loginDeliveryBoy,
  orderComplete,
  myDeliveryOrders,
  sendOTP,
  verifyOTP
};

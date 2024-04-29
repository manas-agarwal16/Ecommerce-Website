import express from "express";
const router = express();

import {
  registerDeliveryBoy,
  loginDeliveryBoy,
  orderComplete,
  myDeliveryOrders,
  sendOTP,
  verifyOTP,
} from "../controllers/deliveryBoy.controller.js";

import { verifyJWTDeliveryBoy } from "../middleware/verifyJWT.js";

router.route("/register").post(registerDeliveryBoy);
router.route("/login").post(loginDeliveryBoy);
router.route("/order-complete").post(verifyJWTDeliveryBoy, orderComplete);
router.route("/orders").get(verifyJWTDeliveryBoy, myDeliveryOrders);
router.route("/send-otp").get(verifyJWTDeliveryBoy, sendOTP);
router.route("/verify-otp").post(verifyJWTDeliveryBoy, verifyOTP);

export default router;

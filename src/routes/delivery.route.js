import express from "express";
const router = express();

import {
  registerDeliveryBoy,
  loginDeliveryBoy,
  orderComplete,
  myDeliveryOrders,
} from "../controllers/deliveryBoy.controller.js";
import { verifyJWTDeliveryBoy } from "../middleware/verifyJWT.js";

router.route("/register").post(registerDeliveryBoy);
router.route("/login").post(loginDeliveryBoy);
router.route("/order-complete").post(verifyJWTDeliveryBoy, orderComplete);
router.route("/orders").get(verifyJWTDeliveryBoy, myDeliveryOrders);

export default router;

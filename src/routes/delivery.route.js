import express from "express";
const router = express();

import { registerDeliveryBoy, loginDeliveryBoy } from "../controllers/deliveryBoy.controller.js";

router.route("/register").post(registerDeliveryBoy);
router.route("/login").post(loginDeliveryBoy);

export default router
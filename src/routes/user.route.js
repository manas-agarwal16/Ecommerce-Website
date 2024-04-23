import express from "express";

const router = express();

import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updateUserDetails,
  changeCurrentUserPassword,
} from "../controllers/user.controller.js";

import { verifyJWT } from "../middleware/verifyJWT.js";

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-access-token").post(refreshAccessToken);
router.route("/update-user-details").post(verifyJWT, updateUserDetails);
router.route("/change-password").post(verifyJWT, changeCurrentUserPassword);

export default router;

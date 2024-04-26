import expresss from "express";
import { verifyJWT } from "../middleware/verifyJWT.js";
import upload from "../middleware/multer.js";
const router = expresss();

import {
  addNewProduct,
  getRandomProducts,
  getProductsByCategory,
  orderProduct,
  addToCart,
  myOrders,
} from "../controllers/product.controller.js";

router
  .route("/add-new-product")
  .post(upload.array("productImages", 12), verifyJWT, addNewProduct);
router.route("/order-product").post(verifyJWT, orderProduct);
router.route("/add-to-cart").post(verifyJWT, addToCart);
router.route("/get-random-products").get(getRandomProducts);
router.route("/category/:category").get(getProductsByCategory); //here :category is the placeholder for category and u can access it using req.params.category.(colon is used to pass data through req.)
router.route("/my-orders").get(verifyJWT, myOrders);

export default router;

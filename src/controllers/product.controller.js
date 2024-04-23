import { asyncHandler } from "../utils/asyncHandler.js";
import { Product } from "../models/products.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Order } from "../models/order.model.js";
import { Cart } from "../models/cart.model.js";
import { User } from "../models/users.model.js";
import mongoose from "mongoose";

const categories = [
  "Electronics",
  "Clothing",
  "Books",
  "Home & Kitchen",
  "Toys",
  "Beauty",
  "Sports",
  "Others",
];

const addNewProduct = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(501, "invalid request!!!");
  }

  const { productName, companyName, category, price, stock } = req.body;
  if (!productName || !companyName || !category || !price || !stock) {
    throw new ApiError(401, "All fields required!!!");
  }

  const include = categories.includes(category);
  if (!include) {
    throw new ApiError(401, "invalid Category");
  }
  const newProduct = new Product({
    user_id: user?._id,
    productName,
    companyName,
    category,
    price,
    stock,
  });
  newProduct
    .save()
    .then(() => {
      console.log("product added to db successfully.");
    })
    .catch((err) => {
      throw new ApiError(501, "error in adding new product to db", err);
    });

  res.status(201).json(new ApiResponse(201, "new product added successfully"));
});

const getRandomProducts = asyncHandler(async (req, res) => {
  const products = await Product.find(); // returns all documents.

  console.log(products);

  const randomProducts = [];
  for (let i = 1; i < products.length && i <= 5; i++) {
    const index = Math.floor(Math.random() * products.length);
    randomProducts.push(products[index]);
  }

  res
    .status(201)
    .json(new ApiResponse(201, "random products fetched successfully!!!"));
});

const getProductsByCategory = asyncHandler(async (req, res) => {
  const category = req.params?.category;
  const include = categories.includes(category);
  if (!include) {
    throw new ApiError(401, "invalid category");
  }

  const categoryProducts = await Product.aggregate([
    {
      $match: {
        category: category,
      },
    },
  ]);

  if (categoryProducts.length === 0) {
    return res
      .status(201)
      .json(
        new ApiResponse(201, "no products with this category are available")
      );
  }

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { products: categoryProducts },
        `products with ${category} category are fetch successfully!!!`
      )
    );
});

const orderProduct = asyncHandler(async (req, res) => {
  const { product_id } = req.body;
  const user = req.user;

  if (!user) {
    throw new ApiError(501, "invalid request");
  }
  if (!product_id) {
    throw new ApiError(401, "product_id is required");
  }
  let product = await Product.findById({ _id: product_id });

  if (!product) {
    throw new ApiError(401, "product does not exist with product_id");
  }

  const currentStock = product.stock - 1;
  if (product.stock <= 0) {
    return res
      .status(201)
      .json(new ApiResponse(201, "currently product is out of stock "));
  }

  product = await Product.findByIdAndUpdate(
    { _id: product_id },
    { stock: currentStock }
  );

  const newOrder = new Order({
    user_id: user._id,
    product_id: product_id,
  });

  newOrder
    .save()
    .then(() => {
      console.log("product added in orders successfully");
    })
    .catch((err) => {
      throw new ApiError(501, "error in saving new order to db", err);
    });

  res.status(201).json(new ApiResponse(201, "order is placed successfully"));
});

const addToCart = asyncHandler(async (req, res) => {
  const user = req.user;
  const { product_id } = req.body;

  if (!user) {
    throw new ApiError(501, "invalid request");
  }
  if (!product_id) {
    throw new ApiError(401, "product_id is required");
  }

  const product = await Product.findById({ _id: product_id });

  if (!product) {
    throw new ApiError(401, "no such product exists with product_id");
  }

  const newProductToCart = new Cart({
    user_id: user._id,
    product_id: product_id,
  });

  newProductToCart
    .save()
    .then(() => {
      console.log("product added to card successfully");
    })
    .catch((err) => {
      throw new ApiError(501, "error in saving product to cart", err);
    });

  res
    .status(201)
    .json(new ApiResponse(201, "product added to card successfully"));
});

const myOrders = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(501, "invalid request");
  }
  const Orders = await Order.aggregate([
    {
      $match: {
        user_id: new mongoose.Types.ObjectId(user?._id),
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "product_id",
        foreignField: "_id",
        as: "UserOrders",
      },
    },
  ]);
  console.log(Orders);

  res.json({ message: "hello" });
});

export {
  addNewProduct,
  getRandomProducts,
  getProductsByCategory,
  orderProduct,
  addToCart,
  myOrders,
};

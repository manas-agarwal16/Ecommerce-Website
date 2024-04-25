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

  const exists = await Product.aggregate([
    {
      $match: {
        productName: productName.toLowerCase().trim(),
        companyName: companyName.toLowerCase().trim(),
      },
    },
  ]);

  console.log(exists);

  if (exists.length >= 1) {
    throw new ApiError(401, "items with same company name already exists");
  }

  const newProduct = new Product({
    user_id: user?._id,
    productName: productName.toLowerCase().trim(),
    companyName: companyName.toLowerCase().trim(),
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

  res
    .status(201)
    .json(new ApiResponse(201, newProduct, "new product added successfully"));
});

const getRandomProducts = asyncHandler(async (req, res) => {
  const products = await Product.find(); // returns all documents.

  console.log(products);

  let randomProducts = [];
  if (products.length > 5) {
    for (let i = 1; i <= 5; i++) {
      const index = Math.floor(Math.random() * products.length);
      randomProducts.push(products[index]);
    }
  } else {
    randomProducts = products;
  }
  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        randomProducts,
        "random products fetched successfully!!!"
      )
    );
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
  const { product_id, quantity } = req.body;

  if (!product_id || !quantity) {
    throw new ApiError(401, "all fields required!!");
  }
  const user = req.user;

  if (!user) {
    throw new ApiError(501, "invalid request");
  }

  let product = await Product.findById({ _id: product_id });

  if (!product) {
    throw new ApiError(401, "product does not exist with product_id");
  }

  if (product.stock === 0) {
    return res
      .status(201)
      .json(new ApiResponse(201, "currently product is out of stock"));
  }
  const currentStock = product.stock - quantity;
  console.log("current Stock", currentStock);
  if (product.stock < 0) {
    return res
      .status(201)
      .json(
        new ApiResponse(201, `${quantity} of this product are not available`)
      );
  }

  product = await Product.findByIdAndUpdate(
    { _id: product_id },
    { stock: currentStock },
    { new: true } //returns the updated document
  );

  console.log(product);
  const newOrder = new Order({
    user_id: user._id,
    product_id: product_id,
    quantity: quantity,
  });

  newOrder
    .save()
    .then(() => {
      console.log("product added in orders successfully");
    })
    .catch((err) => {
      throw new ApiError(501, "error in saving new order to db", err);
    });

  res
    .status(201)
    .json(new ApiResponse(201, {"Your Order" : product , "quantity" : quantity}, "order is placed successfully"));
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

  const exists = await Cart.findOne({ product_id: product_id });

  if (Object.keys(exists).length != 0) {
    return res
      .status(201)
      .json(new ApiResponse(201, "product is already added to cart"));
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
    .json(new ApiResponse(201, product, "product added to card successfully"));
});

const myOrders = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(501, "invalid request");
  }
  const orders = await Order.aggregate([
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
        as: "userOrders",
      },
    },
    {
      $project: {
        userOrders: 1,
        quantity: 1,
      },
    },
    {
      $unwind: "$userOrders",
    },
  ]);
  // console.log(Orders[0].allUserOrders);
  // const userOrders = Orders[0].allUserOrders;
  console.log(orders);

  return res
    .status(201)
    .json(new ApiResponse(201, orders , "user orders fetched successfully"));
});

export {
  addNewProduct,
  getRandomProducts,
  getProductsByCategory,
  orderProduct,
  addToCart,
  myOrders,
};

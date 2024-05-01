import { asyncHandler } from "../utils/asyncHandler.js";
import { Product } from "../models/products.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Order } from "../models/order.model.js";
import { Cart } from "../models/cart.model.js";
import mongoose from "mongoose";
import { uploadOncloudinary } from "../utils/cloudinary.js";
import { assignToDeliveryBoy } from "../utils/AssignToDeliveryBoy.js";

const categories = [
  "electronics",
  "clothing",
  "books",
  "home & kitchen",
  "toys",
  "beauty",
  "sports",
  "others",
];

const addNewProduct = asyncHandler(async (req, res) => {
  const user = req.user;
  // console.log(req.user);
  if (!user) {
    throw new ApiError(501, "invalid request!!!");
  }

  // console.log(req.body);

  const { productName, companyName, category, price, stock, description } =
    req.body;
  if (
    !productName ||
    !companyName ||
    !category ||
    !price ||
    !stock ||
    !description
  ) {
    throw new ApiError(401, "All fields required!!!");
  }

  const include = categories.includes(category.toLowerCase().trim());
  if (!include) {
    throw new ApiError(401, "invalid Category");
  }

  // const exists = await Product.aggregate([
  //   {
  //     $match: {
  //       productName: productName.toLowerCase().trim(),
  //       companyName: companyName.toLowerCase().trim(),
  //     },
  //   },
  // ]);

  // if (exists.length >= 1) {
  //   throw new ApiError(401, "items with same company name already exists");
  // }

  const productImages = req.files;
  console.log(req.files);
  if (!productImages || productImages.length === 0) {
    throw new ApiError(401, "atleat one image is required in productImage");
  }
  if (productImages.length > 12) {
    throw new ApiError(401, "12 is the limit of productImage");
  }

  const arrayLocalPath = [];
  // console.log(productImages[0]?.path);
  for (let i = 0; i < productImages.length; i++) {
    arrayLocalPath.push(productImages[i]?.path);
  }

  console.log(arrayLocalPath[0]);

  const productImageCloudinaryURL = [];
  for (let i = 0; i < arrayLocalPath.length; i++) {
    const result = await uploadOncloudinary(arrayLocalPath[i]);
    console.log(result);
    if (!result) {
      console.log("error in uploading file to cloudinary!!");
    }
    productImageCloudinaryURL.push(result.url);
  }

  const newProduct = new Product({
    user_id: user?._id,
    productName: productName.toLowerCase().trim(),
    companyName: companyName.toLowerCase().trim(),
    category,
    price,
    stock,
    description,
    productImages: productImageCloudinaryURL,
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
  const include = categories.includes(category.toLowerCase().trim());
  if (!include) {
    throw new ApiError(401, "invalid category");
  }

  const categoryProducts = await Product.aggregate([
    {
      $match: {
        category: category.toLowerCase().trim(),
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
  console.log(product_id, quantity);
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
  let newOrder = new Order({
    user_id: user._id,
    product_id: product_id,
    quantity: quantity,
    address: user.address,
    //orderStatus default in pending
  });

  await newOrder
    .save()
    .then(() => {
      console.log("product added in orders successfully");
    })
    .catch((err) => {
      throw new ApiError(501, "error in saving new order to db", err);
    });

  const delivery = await assignToDeliveryBoy(newOrder._id);
  console.log(delivery);
  if (delivery === "Ordered assigned to delivery Boy successfully") {
    const updateStatusToPlaced = await Order.findByIdAndUpdate(
      { _id: newOrder._id },
      { orderStatus: "placed" },
      { new: true }
    );
    console.log(updateStatusToPlaced);
    if (!updateStatusToPlaced) {
      throw new ApiError(501, "error in updating status of order to placed.");
    }
  }

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { "Your Order": product, quantity: quantity },
        "order is placed successfully"
      )
    );
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

  const product = await Product.findById({ _id: product_id }).select(
    "--stock --owner"
  );

  if (!product) {
    throw new ApiError(401, "no such product exists with product_id");
  }

  const exists = await Cart.findOne({ product_id: product_id });

  if (exists) {
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
        as: "userOrder",
      },
    },
    {
      $lookup: {
        from: "deliveryboyorders",
        localField: "_id",
        foreignField: "order_id",
        as: "deliveryBoyOrder", //using subpipeline
        pipeline: [
          {
            //now u r under deliveryBoyOrders model
            $lookup: {
              from: "deliveryboys",
              localField: "deliveryBoy_id",
              foreignField: "_id",
              as: "yourDeliveryBoy",
              pipeline: [
                //again using subpipeline to only fetch some data from the deliveryBoys document
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
        ],
      },
    },
    {
      $unwind: "$userOrder",
    },
    {
      $unwind: "$deliveryBoyOrder",
    },
    {
      $project: {
        userOrder: 1, // actually here 1 means the same see quantity
        quantity: "$quantity", //'$' sign
        address: 1,
        description: 1,
        yourDeliveryBoy: "$deliveryBoyOrder.yourDeliveryBoy",
      },
    },
    {
      $unwind: "$yourDeliveryBoy",
    },
  ]);
  // console.log(Orders[0].allUserOrders);
  // const userOrders = Orders[0].allUserOrders;
  console.log(orders);

  return res
    .status(201)
    .json(new ApiResponse(201, orders, "user orders fetched successfully"));
});

const myCart = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, "invalid request");
  }
  const myCartProducts = await Cart.aggregate([
    {
      $match: {
        user_id: user?._id,
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "product_id",
        foreignField: "_id",
        as: "cartProducts",
        pipeline: [
          {
            $project: {
              stock: 0,
              owner: 0,
            },
          },
        ],
      },
    },
    {
      $unwind: "$cartProducts",
    },
  ]);
  if (myCartProducts.length === 0) {
    return res
      .status(201)
      .json(new ApiResponse(201, "Current your Cart is empty."));
  }

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        myCartProducts,
        "your cart product fetched successfully"
      )
    );
});

const getByProductName = asyncHandler(async (req, res) => {
  const { productName } = req.params;
  console.log(req.params);
  if (!productName) {
    throw new ApiError(401, "product Name is required");
  }

  const items = await Product.aggregate([
    {
      $match: {
        productName: productName.toLowerCase().trim(),
      },
    },
  ]);
  if (items.length === 0) {
    return res
      .status(201)
      .json(new ApiResponse(201, "sorry we dont have your product"));
  }

  res
    .status(201)
    .json(
      new ApiResponse(201, items, `All ${productName} fetched successfully`)
    );
});

const getProductsByCompanyName = asyncHandler(async (req, res) => {
  const { companyName } = req.params;
  if (!companyName) {
    throw new ApiError(401, "product name is required");
  }
  const items = await Product.aggregate([
    {
      $match: {
        companyName: companyName.toLowerCase().trim(),
      },
    },
  ]);

  if (items.length === 0) {
    return res.status.json(
      new ApiResponse(201, `no product found of this ${companyName}`)
    );
  }
  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        items,
        `all products of ${companyName} fetched successfully`
      )
    );
});

const getByProductNameAndCompanyName = asyncHandler(async (req, res) => {
  const { productName, companyName } = req.params;
  console.log(req.params);

  if (!productName || !companyName) {
    throw new ApiError("all fields required");
  }
  const items = await Product.aggregate([
    {
      $match: {
        productName: productName.toLowerCase().trim(),
        companyName: companyName.toLowerCase().trim(),
      },
    },
  ]);

  if (items.length === 0) {
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          `sorry we dont have this product of ${companyName
            .toLowerCase()
            .trim()}`
        )
      );
  }
  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        items,
        `product of ${companyName} fetched successfully`
      )
    );
});

const updateProductDetails = asyncHandler(async (req, res) => {
  const owner = req.user;
  const {
    oldProductName,
    oldCompanyName,
    newProductName,
    newCompanyName,
    description,
    category,
    price,
  } = req.body;

  if (
    !oldCompanyName ||
    !oldProductName ||
    !newCompanyName ||
    !newProductName ||
    !category ||
    !description ||
    !price
  ) {
    throw new ApiError(401, "all fields required");
  }
  const exists = await Product.aggregate([
    {
      $match: {
        productName: oldProductName,
        companyName: oldCompanyName,
      },
    },
  ]);

  if (exists.length === 0) {
    throw new ApiError(401, "no such product found");
  }

  if (exists[0].owner !== owner) {
    throw new ApiError(401, "Wrong owner name or Invalid request");
  }

  const update = await Product.findOneAndUpdate(
    { productName: oldProductName, companyName: oldCompanyName },
    {
      $set: {
        //if updating multiple fields $set in necessary
        category: category,
        productName: newProductName,
        companyName: newCompanyName,
        description: description,
        price : price
      },
    },
    { new: true }
  );

  if (!update) {
    throw new ApiError(501, "error in updating product details");
  }

  res
    .status(201)
    .json(
      new ApiResponse(201, update, "Your product details updated successfully")
    );
});

const getProductDetails = asyncHandler(async (req, res) => {
  const { product_id } = req.body;
  if (!product_id) {
    throw new ApiError(401, "product_id required");
  }

  const product = await Product.findOne({
    _id: product_id,
  });

  if (!product) {
    throw new ApiError(
      401,
      "No such product found or theres no product of yours"
    );
  }

  res
    .status(201)
    .json(
      new ApiResponse(201, product, "product details fetched successfully")
    );
});

export {
  addNewProduct,
  getRandomProducts,
  getProductsByCategory,
  orderProduct,
  addToCart,
  myOrders,
  getByProductNameAndCompanyName,
  getProductsByCompanyName,
  getByProductName,
  getProductDetails,
  updateProductDetails,
  myCart,
};

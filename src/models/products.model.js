import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    productName: {
      type: String,
      require: true,
    },
    companyName: {
      type: String,
      require: true,
    },
    category: {
      type: String,
      enum: [
        "Electronics",
        "Clothing",
        "Books",
        "Home & Kitchen",
        "Toys",
        "Beauty",
        "Sports",
        "Others",
      ],
      require: true,
    },
    price: {
      type: Number,
      require: true,
    },
    stock: {
      type: Number,
      require: true,
    },
  },
  { timestamps: true }
);

//compound index to store only unique productName with same companyName;
productSchema.index({ productName: 1, companyName: 1 }, { unique: true });

export const Product = mongoose.model("Product", productSchema);

import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    user_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "users",
        require : true,
    },
    product_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "products",
        require : true,
    }
});

export const Order = mongoose.model("Order",orderSchema);
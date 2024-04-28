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
    },
    quantity : {
        type : Number,
        default : 0,
    },
    address : {
        type : String,
        require : true,
    },
    orderStatus : {
        type : String,
        enum : ["pending","placed"],
        default : "pending",
    }
},{timestamps : true});

export const Order = mongoose.model("Order",orderSchema);
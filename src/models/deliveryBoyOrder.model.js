import mongoose from "mongoose";

const deliveryBoyOrderSchema = new mongoose.Schema({
    deliveryBoy_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "DeliveryBoy",
    },
    order_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Order",
    },
    assignedAt : {
        type : Date,
        default: Date.now //will store the date when document is created.
    }
})

export const DeliveryBoyOrder = mongoose.model("DeliveryBoyOrder",deliveryBoyOrderSchema);
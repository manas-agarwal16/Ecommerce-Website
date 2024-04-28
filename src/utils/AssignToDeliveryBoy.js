import { DeliveryBoy } from "../models/deliveryBoy.model.js";
import { DeliveryBoyOrder } from "../models/deliveryBoyOrder.model.js";
import { ApiError } from "./ApiError.js";

const assignToDeliveryBoy = async (order_id) => {
  const freeDeliveryBoy = await DeliveryBoy.findOne({ status: "active" });

  if (!freeDeliveryBoy) {
    console.log("No delivery Boy is available now");
    return "No delivery Boy is available now";
  } else {
    //assigning order to delivery boy
    const addOrder = new DeliveryBoyOrder({
      order_id: order_id,
      deliveryBoy_id: freeDeliveryBoy._id,
    });

    //updating delivery boy status.
    const updateStatus = await DeliveryBoy.findByIdAndUpdate(
      { _id: freeDeliveryBoy._id },
      { status: "onDelivery" },
      { new: true }
    );
    if (!updateStatus) {
      throw new ApiError(501, "error in updating status of Delivery boy");
    }
    let message;
    await addOrder
      .save()
      .then(() => {
        console.log("Ordered assigned to delivery Boy successfully");
        message = "Ordered assigned to delivery Boy successfully";
      })
      .catch((err) => {
        throw new ApiError(
          501,
          "error in saving document in DeliveryBoyOrder",
          err
        );
      });
      return message;
  }
};

export { assignToDeliveryBoy };

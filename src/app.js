import express from "express"

const app = express();

import userRouter from "./routes/user.route.js"
import productRouter from "./routes/product.route.js";

app.use("/api/users", userRouter);
app.use("/api/product",productRouter);

export {app};
import express from "express";
import cookieParser from "cookie-parser";


const app = express();
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

import userRouter from "./routes/user.route.js";
import productRouter from "./routes/product.route.js";

app.use("/api/users", userRouter);
app.use("/api/product", productRouter);

export { app };

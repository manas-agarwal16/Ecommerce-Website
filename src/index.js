import dotenv from "dotenv";
dotenv.config({
  path: "../.env",
});

import { connectDB } from "./db/dbConnection.js";
import { app } from "./app.js";

connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`server is running on the port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("error in connecting express to db");
    throw err;
  });

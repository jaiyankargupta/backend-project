// import monngoos from "mongoos";
// import { DB_NAME } from "./constant";
// import express from "express";

import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./env",
});

connectDB();

// const app = express();

// async () => {
//   try {
//     await monngoos.connect(`${process.env.MONDODB_URI}/${DB_NAME}`);
//     app.on("error", () => {
//       console.log("error", error);
//     });
//     app.listen(process.env.PORT, () => {
//       console.log("listening...", process.env.PORT);
//     });
//   } catch (error) {
//     console.log("Error: ", error);
//     throw error;
//   }
// };

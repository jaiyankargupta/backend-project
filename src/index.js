// import monngoos from "mongoos";
// import { DB_NAME } from "./constant";
// import express from "express";

import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
const port = process.env.PORT || 3000;

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() =>
    app.listen(port, () => {
      console.log("listening.. at port", port);
    })
  )
  .catch((err) => {
    console.log("db cvonnection failed", err);
  });

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

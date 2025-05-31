import { AsyncHandler } from "../utils/asyncHadler.js";

const registerUser = AsyncHandler(async (req, res) => {
  res.status(200).json({
    message: "rustyn",
  });
});

export { registerUser };

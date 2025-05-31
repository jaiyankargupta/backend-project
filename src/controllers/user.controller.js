import { ApiError } from "../utils/ApiError.js";
import { AsyncHandler } from "../utils/asyncHadler.js";
import { User } from "../models/user.models.js";
import { uploadonCoudnary } from "../utils/cloudnary.js";
import { ApiRespose } from "../utils/ApiResponse.js";

const registerUser = AsyncHandler(async (req, res) => {
  //get user detailed from the UI
  const { fullname, email, password, username } = req.body;
  //validation apply

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //check user is already exist using varioud ways
  const userExisted = User.findOne({
    $or: [{ username }, { email }],
  });

  if (userExisted) {
    throw new ApiError(409, "user is already exist");
  }
  // check for user avatar, images
  const localAvatarFilePath = req.files?.avatar[0]?.path;
  const localCoverFilePath = req.files?.coverImage[0]?.path;

  if (!localAvatarFilePath) {
    throw new ApiError(400, "avatar is compulsory");
  }

  // upload them to cloudnary

  const avatar = await uploadonCoudnary(localAvatarFilePath);
  const coverImage = await uploadonCoudnary(localCoverFilePath);
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }
  // create a object - create entry in db
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url,
    email,
    password,
    username: username.toLowerCase(),
  });
  // check for user creation
  // remove pass and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "somethings went wrong while registering the user");
  }

  // return res
  return res
    .status(201)
    .json(new ApiRespose(200, createdUser, "user regsitered succesfully"));
});

export { registerUser };

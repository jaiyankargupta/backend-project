import { ApiError } from "../utils/ApiError.js";
import { AsyncHandler } from "../utils/asyncHadler.js";
import { User } from "../models/user.models.js";
import { uploadonCoudnary } from "../utils/cloudnary.js";
import { ApiRespose } from "../utils/ApiResponse.js";

import jwt from "jsonwebtoken";

const generateAccessAndReferenshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { refreshToken, accessToken };
  } catch (error) {
    throw new ApiError(
      500,
      "somthings went wrong while generating refresh and access token "
    );
  }
};

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
  const userExisted = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (userExisted) {
    throw new ApiError(409, "user is already exist");
  }
  // check for user avatar, images
  const localAvatarFilePath = req.files?.avatar[0]?.path;
  // const localCoverFilePath = req.files?.coverImage[0]?.path;

  let localCoverFilePath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    localCoverFilePath = req.files.coverImage[0].path;
  }

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

const loginUser = AsyncHandler(async (req, res) => {
  //req body -> data
  const { email, username, password } = req.body;

  // username or email
  if (!username && !email) {
    throw new ApiError(400, "username or password required");
  }

  // find the user
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "user doesnot exist");
  }
  // check the pass
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(404, "credential is not correct");
  }

  // access and refresh token

  const { accessToken, refreshToken } = await generateAccessAndReferenshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id);
  select("-password -refreshToken");

  //modified by server only
  const options = {
    httpOnly: true,
    secure: true,
  };
  // send cookie
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiRespose(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user loggedIn successfully"
      )
    );
});

const logOutUser = AsyncHandler(async (req, res) => {
  await User.findById(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  //modified by server only
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiRespose(200, {}, "User logged Out"));
});

const refreshAccessToken = AsyncHandler(async (req, res) => {
  const inComingRefreshToken = req.cookie;
  refreshToken || req.body.refreshToken;
  if (!inComingRefreshToken) {
    throw new ApiError(401, "unauthorizd request");
  }

  try {
    const decodedToken = jwt.verify(
      inComingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "unauthorized request");
    }

    if (inComingRefreshToken != user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshAccessToken } =
      await generateAccessAndReferenshTokens(user?._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshAccessToken, options)
      .json(
        new ApiRespose(
          200,
          { accessToken, newRefreshAccessToken },
          "access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh Token");
  }
});

const channelCurrentPassword = AsyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res.status(200).json(new ApiRespose(200, {}, "Password changed"));
});

const getCurrentUser = AsyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiRespose(200, req.user, "current user fetched successfully"));
});

const updateAccountDetails = AsyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiRespose(200, user, "Account details updated"));
});
const UpdateAvatar = AsyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const avatar = await uploadonCoudnary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(400, "error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiRespose(200, user, "avatar Image is update successfully"));
});

const updateCoverImage = AsyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "cover file is missing");
  }
  const coverImage = await uploadonCoudnary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "error while uploading on cover file");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImaage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiRespose(200, user, "cover Image is update successfully"));
});

export {
  registerUser,
  logOutUser,
  loginUser,
  refreshAccessToken,
  getCurrentUser,
  channelCurrentPassword,
  updateAccountDetails,
  UpdateAvatar,
  updateCoverImage,
};

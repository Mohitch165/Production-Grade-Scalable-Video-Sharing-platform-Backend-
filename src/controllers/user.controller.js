import { asyncHandler } from "../util/asyncHandler.js";
import { ApiError } from "../util/ApiError.js";
import { User } from "../models/users.model.js";
import { z } from "zod";
import { uploadToCloudinary, deleteFromCloudinary } from "../util/cloudinary.js";
import { ApiResponse } from "../util/ApiResponse.js";
import  jwt  from "jsonwebtoken";
import mongoose, { Types } from "mongoose";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullname: z.string().min(3, "Full name must be at least 3 characters"),
});

const registerUser = asyncHandler(async (req, res) => {
      const result = registerSchema.safeParse(req.body);

      if (!result.success) {
        const formattedErrors = result.error.flatten().fieldErrors;
        throw new ApiError(400, "Validation failed", formattedErrors);
      }

      const { username, email, password, fullname } = result.data;

      const existingUser = await User.findOne({
        $or: [{ username }, { email }],
      });

      if (existingUser) {
        throw new ApiError(410, "User already exists");
      }

      const avatarLocalPath = req.files?.avatar?.[0]?.path;
      const bannerLocalPath = req.files?.banner?.[0]?.path;

      if(!avatarLocalPath || !bannerLocalPath) {
        throw new ApiError(409, "Avatar and banner are required");
      }

      let avatar;

      try {

        avatar = await uploadToCloudinary(avatarLocalPath);

      } catch (error) {

        throw new ApiError(409, "Error uploading avatar");
      }

      let banner;

      try {

        banner = await uploadToCloudinary(bannerLocalPath);
        
      } catch (error) {

        throw new ApiError(409, "Error uploading banner");

      }


      try {
        const user = await User.create({
          fullname,
          username,
          email,
          password,
          avatar: avatar?.url,
          banner: banner?.url
        })
  
        const createdUser = await User.findById(user._id).select("-password -refreshToken");
  
        if(!createdUser) {
          throw new ApiError(404, "User not found");
        }
  
        res.status(201).json( new ApiResponse(201, createdUser, "User created successfully"));
      } catch (error) {
        console.log("Error creating user", error);
        if(avatar){
          await deleteFromCloudinary(avatar?.public_id);
        }
        if(banner){
          await deleteFromCloudinary(banner?.public_id);
        }
        throw new ApiError(408, "Error creating user");
      }
});
const generateTokens = async (userId) => {
 try {
   const user = await User.findById(userId);
   if(!user) {
     throw new ApiError(404, "User not found");
   }
   const accessToken = user.createAccessToken();
   const refreshToken = user.createRefreshToken();
   user.refreshToken = refreshToken;
   await user.save({ validateBeforeSave: false });
   return { accessToken, refreshToken };
 } catch (error) {
   throw new ApiError(408, "Error generating tokens");
 }
}

const loginUser = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;

  if(!email || !password) {
    throw new ApiError(409, "Email and password are required");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  const passwordCheck = await existingUser.comparePasswords(password);

  if (!passwordCheck) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateTokens(existingUser._id);

  const loggedInUser = await User.findById(existingUser._id)
    .select("-password -refreshToken");

    if(!loggedInUser) {
      throw new ApiError(404, "User not found");
    }

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  }

  return res
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .status(200)
  .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: "",
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .status(200)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const regenRefAccToken = asyncHandler(async (req, res) => {
  const expRefToken = req.cookies.refreshToken || req.body.refreshToken;

  if(!expRefToken) {
    throw new ApiError(401, "Refresh Token is Required");
  }

  try {
    const decodedToken =jwt.verify(expRefToken, process.env.REFRESH_TOKEN_SECRET);
    const user =await User.findById(decodedToken?._id);

    if(!user) {
      throw new ApiError(401, "Invalid User Token");
    }

    if(expRefToken !== user?.refreshToken) {
      throw new ApiError(401, "Invalid User Token");
    }

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    }

    const { accessToken, refreshToken: newRefreshToken } = 
    await generateTokens(user._id);

    return res
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .status(200)
    .json(
      new ApiResponse(200, 
        { accessToken, 
          refreshToken: newRefreshToken }, 
          "Tokens Regenerated"
        ));
  } catch (error) {
    throw new ApiError(500, "Something went wrong while regenerating tokens");
  }

})

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if(!oldPassword || !newPassword) {
    throw new ApiError(409, "Old password and new password are required");
  }

  const user = await User.findById(req.user?._id);
  const isValidPassword = await user.comparePasswords(oldPassword);

  if(!isValidPassword) {
    throw new ApiError(401, "Invalid credentials");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
})

const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullname, username } = req.body;
  const updateFields = {};

  if (fullname) updateFields.fullname = fullname;
  if (username) updateFields.username = username;

  // Handle avatar upload
  if (req.files?.avatar?.[0]) {
    const avatarLocalPath = req.files.avatar[0].path;
    const avatar = await uploadToCloudinary(avatarLocalPath);
    if (!avatar?.url) {
      throw new ApiError(500, "Failed to upload avatar");
    }
    updateFields.avatar = avatar.url;
  }

  // Handle banner upload
  if (req.files?.banner?.[0]) {
    const bannerLocalPath = req.files.banner[0].path;
    const banner = await uploadToCloudinary(bannerLocalPath);
    if (!banner?.url) {
      throw new ApiError(500, "Failed to upload banner");
    }
    updateFields.banner = banner.url;
  }

  if (Object.keys(updateFields).length === 0) {
    throw new ApiError(400, "No Valid fields to update, please give valid fields");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateFields },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "User updated successfully"));
});

const getUserChannelDetails = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if(!username?.trim()) {
    throw new ApiError(409, "Username is required");
  }

  const channel =  await User.aggregate(
    [
      {
        $match: {
          username: username?.toLowerCase()
        }
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers"
        }
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscriptions"
        }
      },
      {
        $addFields: {
          subscribersCount: { $size: "$subscribers" },
          subscriptionsCount: { $size: "$subscriptions" },
          }
        }, 
        {
        $project: {
          _id: 1,
          username: 1,
          fullname: 1,
          avatar: 1,
          banner: 1,
          subscribersCount: 1,
          subscriptionsCount: 1,
        }
      }
    ]
  )

  if(!channel?.length) {
    throw new ApiError(404, "Channel not found");
  }

  return res
  .status(200)
  .json(new ApiResponse(200, channel[0], "Channel details fetched successfully"));
})

const watchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate(
    [
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.user?._id)
        }
      },
      {
        $lookup: {
          from: "videos",
          localField: "watchHistory",
          foreignField: "_id",
          as: "watchHistory",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                  {
                    $project: {
                      _id: 1,
                      username: 1,
                      fullname: 1,
                      email: 1,
                      avatar: 1
                    }
                  }
                ]
              }
            },
            {
              $addFields: {
                owner: { $arrayElemAt: ["$owner", 0] }
              }
            }
          ]
        }
      }
    ]
  )

  if(!user?.length) {
    throw new ApiError(404, "Watch history not found");
  }

  return res.status(200).json(new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully"));
})

export { registerUser, loginUser, logoutUser, regenRefAccToken, changePassword, updateUserDetails, getUserChannelDetails, watchHistory };
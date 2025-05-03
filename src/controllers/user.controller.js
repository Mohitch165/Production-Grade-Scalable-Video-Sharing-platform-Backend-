import { asyncHandler } from "../util/asyncHandler.js";
import { ApiError } from "../util/ApiError.js";
import { User } from "../models/users.model.js";
import { z } from "zod";
import { uploadToCloudinary, deleteFromCloudinary } from "../util/cloudinary.js";
import { ApiResponse } from "../util/ApiResponse.js";

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
export { registerUser, loginUser };
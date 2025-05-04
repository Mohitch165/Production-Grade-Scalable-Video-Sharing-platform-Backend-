import jwt from "jsonwebtoken";
import { asyncHandler } from "../util/asyncHandler.js";
import { ApiError } from "../util/ApiError.js";
import { User } from "../models/users.model.js";

const verifyJWT = asyncHandler(async(req, __, next) => {
    const authToken = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if(!authToken) {
        throw new ApiError(401, "Unauthorized");
    }

    try {
        const decodedToken = jwt.verify(authToken, process.env.ACCESS_TOKEN_SECRET);
        const user =  await User.findById(decodedToken._id).select("-password -refreshToken");

        if(!user) {
            throw new ApiError(401, "Unauthorized");
        }

        req.user = user;
        next();

    } catch (error) {
        throw new ApiError(401, error?.message || "Unauthorized");
    }
})

export { verifyJWT }
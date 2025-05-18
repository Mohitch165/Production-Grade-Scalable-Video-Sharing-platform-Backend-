import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/likes.model.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;
  //TODO: toggle like on video

  if(!videoId || !isValidObjectId(videoId)){
    throw new ApiError(400, "videoId is not defined or not valid")
  }

  if(!userId || !isValidObjectId(userId)){
    throw new ApiError(400, "userId is not defined or not valid")
  }

  let message = ""

  try {
    const existingLike = await Like.findOne({
      video: videoId,
      likedBy: userId,
    });

    if(existingLike){

      await existingLike.deleteOne();
      message = "Video unliked successfully"

    } else {

      await Like.create({
        video: videoId,
        likedBy: userId,
      });
      message = "Video liked successfully"

    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, message));

  } catch (error) {

    console.error(error, error.message);
    throw new ApiError(500, "Error toggling video like");

  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };

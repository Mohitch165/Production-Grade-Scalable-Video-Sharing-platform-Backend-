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

  const userId = req.user?._id;

  if(!commentId || !isValidObjectId(commentId)){
    throw new ApiError(400, "commentId is not defined or not valid")
  }

  if(!userId || !isValidObjectId(userId)){
    throw new ApiError(400, "userId is not defined or not valid")
  }

  let message = existingLike ? "Comment unliked successfully" : "Comment liked successfully";

  try  {

    const existingLike = await Like.findOne({
      comment: commentId,
      likedBy: userId,
    });

    if(existingLike){
      await existingLike.deleteOne();
    } else {
      await Like.create({
        comment: commentId,
        likedBy: userId,
      });
    }

    const message = existingLike
      ? "Comment unliked successfully"
      : "Comment liked successfully";

    return res
      .status(200)
      .json(new ApiResponse(200, null, message));

  } catch (error) {

    console.error(error, error.message);
    throw new ApiError(500, "Error toggling comment like", {
      error: error.message
    })
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  const userId = req.user?._id;

  if(!tweetId || !isValidObjectId(tweetId)){
    throw new ApiError(400, "tweetId is not defined or not valid")
  }

  if(!userId || !isValidObjectId(userId)){
    throw new ApiError(400, "userId is not defined or not valid")
  }

  try {

    const existingLike = await Like.findOne({
      tweet: tweetId,
      likedBy: userId,
    });

    if(existingLike){
      await existingLike.deleteOne();
    } else {
      await Like.create({
        tweet: tweetId,
        likedBy: userId,
      })
    }

    const message = existingLike
      ? "Tweet unliked successfully"
      : "Tweet liked successfully";

    return res
      .status(200)
      .json(new ApiResponse(200, null, message));

    } catch (error) {

    console.error(error, error.message);
    throw new ApiError(500, "Error toggling tweet like", {
      error: error.message
    })
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const { userId } = req.params;

  if(!userId || !isValidObjectId(userId)){
    throw new ApiError(400, "userId is not defined or not valid")
  }

  try {
    const likedVideos = await Like.aggregate([
      {
        $match: {
          likedBy: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "videoDetails",
        },
      },
      {
        $unwind: "$videoDetails",
      },
      {
        $project: {
          _id: 1,
          videoId: "$videoDetails._id",
          title: "$videoDetails.title",
          description: "$videoDetails.description",
          thumbnailFile: "$videoDetails.thumbnailFile",
          views: "$videoDetails.views",
          duration: "$videoDetails.duration",
          isPublished: "$videoDetails.isPublished",
          likedAt: "$createdAt",
        },
      },
    ]);

    console.log(likedVideos);

    return res
      .status(200)
      .json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));

  } catch (error) {

    console.error(error, error.message);
    throw new ApiError(500, "Error getting liked videos", {
      error: error.message
    })
  }
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };

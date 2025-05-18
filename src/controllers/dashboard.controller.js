import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/videos.model.js";
import { Subscription } from "../models/subscriptions.model.js";
import { Like } from "../models/likes.model.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  const { channelId } = req.params;

  if(!channelId || !isValidObjectId(channelId)){
    throw new ApiError(400, "channelId is not defined or not valid")
  }

  try {
    const objectId = new mongoose.Types.ObjectId(channelId);

    const videoStats = await Video.aggregate([
      { $match: { owner: objectId } },
      {
        $group: {
          _id: "$owner",
          totalVideos: { $sum: 1 },
          totalViews: { $sum: "$views" },
        },
      },
    ]);

    const likeStats = await Like.aggregate([
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "videoDetails",
        },
      },
      { $unwind: "$videoDetails" },
      { $match: { "videoDetails.owner": objectId } },
      { $count: "totalLikes" },
    ]);

    const subscriberStats = await Subscription.aggregate([
      { $match: { channel: objectId } },
      { $count: "totalSubscribers" },
    ]);

    const stats = {
      totalVideos: videoStats[0]?.totalVideos || 0,
      totalViews: videoStats[0]?.totalViews || 0,
      totalLikes: likeStats[0]?.totalLikes || 0,
      totalSubscribers: subscriberStats[0]?.totalSubscribers || 0,
    };

    return res
      .status(200)
      .json(new ApiResponse(200, stats, "Channel stats fetched successfully"));
  } catch (error) {
    console.error(error);
    throw new ApiError(500, "Error fetching channel stats", {
      message: error.message,
    });
  }
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
    const { channelId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!channelId || !mongoose.isValidObjectId(channelId)) {
      throw new ApiError(400, "channelId is not defined or not valid");
    }

    try {
      const videos = await Video.aggregate([
        {
          $match: {
            owner: new mongoose.Types.ObjectId(channelId),
            isPublished: true,
          },
        },
        {
          $sort: { createdAt: -1 }, // latest videos first
        },
        {
          $skip: (page - 1) * limit,
        },
        {
          $limit: limit,
        },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            thumbnailFile: 1,
            views: 1,
            duration: 1,
            createdAt: 1,
            isPublished: 1,
          },
        },
      ]);

      return res
        .status(200)
        .json(
          new ApiResponse(200, videos, "Channel videos fetched successfully")
        );
    } catch (error) {
      console.error(error);
      throw new ApiError(500, "Error fetching channel videos", {
        error: error.message,
      });
    }
});

export { getChannelStats, getChannelVideos };

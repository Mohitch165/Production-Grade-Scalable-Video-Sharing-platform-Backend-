import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/users.model.js";
import { Subscription } from "../models/subscriptions.model.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription

  const userId = req.user?._id;

  if(!channelId || !isValidObjectId(channelId)){
    throw new ApiError(400, "channelId is not defined or not valid")
  }

  if(!userId || !isValidObjectId(userId)){
    throw new ApiError(400, "userId is not defined or not valid")
  }

        if (channelId.toString() === userId.toString()) {
          throw new ApiError(400, "You cannot subscribe to your own channel");
        }

  try {
    const existingSubscriber = await Subscription.findOne({
      channel: channelId,
      subscriber: userId,
    });

    if(existingSubscriber){
      await existingSubscriber.deleteOne();
    } else {

      await Subscription.create({
        channel: channelId,
        subscriber: userId,
      });
    }

    const message = existingSubscriber
      ? "Successfully unsubscribed"
      : "Successfully subscribed";

    return res
      .status(200)
      .json(new ApiResponse(200, {}, message));
  } catch (error) {
    console.error(error, error.message);
    throw new ApiError(500, "Error toggling subscription", {
      error: error.message,
    })
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if(!channelId || !isValidObjectId(channelId)){
    throw new ApiError(400, "channelId is not defined or not valid")
  }

  try {
    const subscribers = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(channelId),
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "subscriber",
          foreignField: "_id",
          as: "subscriberDetails"
        }
      },
      {
        $unwind: {
          path: "$subscriberDetails",
        }
      },
      {
        $project: {
          _id: 1,
          createdAt: 1,
          "subscriberDetails._id": 1,
          "subscriberDetails.username": 1,
          "subscriberDetails.avatar": 1,
          "subscriberDetails.email": 1,
        }
      }
    ])

    return res
      .status(200)
      .json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"));
  } catch (error) {
    console.error(error, error.message);
    throw new ApiError(500, "Error fetching subscribers", {
      error: error.message,
    })
  }
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if(!subscriberId || !isValidObjectId(subscriberId)){
    throw new ApiError(400, "subscriberId is not defined or not valid")
  }

  try {
    const channels = await Subscription.aggregate([
      {
        $match: {
          subscriber: new mongoose.Types.ObjectId(subscriberId),
        }
      },

      {
        $lookup: {
          from: "users",
          localField: "channel",
          foreignField: "_id",
          as: "channelDetails"
        }
      },
      {
        $unwind: {
          path: "$channelDetails",
        }
      },
      {
        $project: {
          _id: 1,
          createdAt: 1,
          "channelDetails._id": 1,
          "channelDetails.username": 1,
          "channelDetails.avatar": 1,
          "channelDetails.email": 1,
        }
      }
    ])

    return res
      .status(200)
      .json(new ApiResponse(200, channels, "Channels fetched successfully"));
  } catch (error) {
    console.error(error, error.message);
    throw new ApiError(500, "Error fetching channels", {
      error: error.message,
    })
  }
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };

import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweets.model.js";
import { User } from "../models/users.model.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  const user = req.user?._id;

  if(!content) {
    throw new ApiError(400, "Content is required");
  }

  if (content.length > 280) {
    throw new ApiError(400, "Tweet exceeds 280 character limit");
  }

  if(!user || !isValidObjectId(user)) {
    throw new ApiError(400, "Invalid user id");
  }

  try {
    const tweet = await Tweet.create({
      content,
      owner: user,
    });
  
    return res.status(201).json(new ApiResponse(201, tweet, "Tweet created successfully"));

  } catch (error) {
    
    throw new ApiError(408, "Error creating tweet");

  }
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
    const { userId } = req.params;

    if (!userId || !isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid user id");
    }

    try {
      const userTweets = await User.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $lookup: {
            from: "tweets",
            localField: "_id",
            foreignField: "owner",
            as: "allTweets",
          },
        },
        {
          $project: {
            _id: 1,
            username: 1,
            fullname: 1,
            email: 1,
            avatar: 1,
            allTweets: 1,
          },
        },
      ]);

      if (!userTweets.length) {
        throw new ApiError(404, "User not found or has no tweets");
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            userTweets[0],
            "User tweets fetched successfully"
          )
        );
    } catch (error) {
      throw new ApiError(408, "Error getting user tweets");
    }
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const { content } = req.body;

  if(!tweetId || !isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  if(!content) {
    throw new ApiError(400, "Content is required");
  }

  if (content.length > 280) {
    throw new ApiError(400, "Tweet exceeds 280 character limit");
  }

  try {
    const updatedTweet = await Tweet.findByIdAndUpdate(
      tweetId,
      { $set: { content } },
      { new: true }
    );

    if (updatedTweet.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Not authorized to update this tweet");
    }

    if (!updatedTweet) {
      throw new ApiError(404, "Tweet not found");
    }

    return res.status(200).json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));

  } catch (error) {
    throw new ApiError(500, "Error updating the Tweet");
  }

});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };

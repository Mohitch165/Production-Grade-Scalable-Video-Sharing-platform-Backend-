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
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };

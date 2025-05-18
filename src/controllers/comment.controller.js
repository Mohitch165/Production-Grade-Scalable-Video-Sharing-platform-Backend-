import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comments.model.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if(!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

  try {
    const comments = await Comment.aggregate([
      {
        $match: {
          video: new mongoose.Types.ObjectId(videoId)
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      },
      {
        $skip: (pageNumber - 1) * limitNumber,
      },
      {
        $limit: limitNumber
      }
    ]);

    return res
      .status(200)
      .json(new ApiResponse(200, comments, "Comments fetched successfully"));
  } catch (error) {
    console.log("Error fetching comments", error);
    throw new ApiError(500, "Error fetching comments", [
      {
        message: error.message  
      }
    ])
  }
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;
  const user = req.user?._id;

  if(!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  if(!content) {
    throw new ApiError(400, "Content is required");
  }

  if (content.length > 500) {
    throw new ApiError(400, "Comment exceeds 280 character limit");
  }

  if(!user || !isValidObjectId(user)) {
    throw new ApiError(400, "Invalid user id");
  }

  try {
    const comment = await Comment.create({
      content,
      video: videoId,
      owner: user,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, comment, "Comment created successfully"));  
  } catch (error) {
    console.log("Error creating comment", error);
    throw new ApiError(408, "Error creating comment")
  }
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;
  const user = req.user?._id;

  if(!commentId || !isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  if(!content) {
    throw new ApiError(400, "Content is required");
  }

  if (content.length > 500) {
    throw new ApiError(400, "Comment exceeds 280 character limit");
  }

  if(!user || !isValidObjectId(user)) {
    throw new ApiError(400, "Invalid user id");
  }

  try {
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { $set: { content } },
      { new: true }
    );

    if (updatedComment.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Not authorized to update this comment");
    }

    if (!updatedComment) {
      throw new ApiError(404, "Comment not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));

  } catch (error) {
    console.log("Error updating comment", error);
    throw new ApiError(408, "Error updating comment")
  }
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment

  const { commentId } = req.params;
  const user = req.user?._id;

  if(!commentId || !isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  try {
    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (!deletedComment) {
      throw new ApiError(404, "Comment not found");
    }

    if (deletedComment.owner.toString() !== user?._id.toString()) {
      throw new ApiError(403, "Not authorized to delete this comment");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, deletedComment, "Comment deleted successfully"));

  } catch (error) {
    console.log("Error deleting comment", error);
    throw new ApiError(408, "Error deleting comment")
  }
});

export { getVideoComments, addComment, updateComment, deleteComment };

import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/videos.model.js";
import { User } from "../models/users.model.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";
import { uploadToCloudinary } from "../util/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
  const filters = {};

  if(!query){
    throw new ApiError(400, "Query is required");
  }

  filters.title = { $regex: query, $options: "i" };

  if(!userId || !isValidObjectId(userId)){
    throw new ApiError(400, "Invalid user id");
  }

  filters.owner = userId;

  const sort = {};
  if(sortBy && sortType){
    sort[sortBy] = sortType;
  }

let videos;

 try {

   videos = await Video
   .find(filters)
   .sort(sort)
   .skip((page - 1) * limit)
   .limit(limit);

 } catch (error) {

   throw new ApiError(408, "Error fetching videos");
   
 }

  try {

    const totalVideos = await Video.countDocuments(filters);
  
    return res
    .status(200)
    .json(new ApiResponse(200, {
      videos, 
      totalVideos,
      page: parseInt(page), 
      limit: parseInt(limit)},
      "Videos fetched successfully"));

  } catch (error) {

    throw new ApiError(408, "Error fetching videos");

  }
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnailFile?.[0]?.path;
  const user = req.user;

  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "Video and thumbnail are required");
  }

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }

  let videoFile, thumbnailFile;

  try {

    videoFile = await uploadToCloudinary(videoLocalPath);
    thumbnailFile = await uploadToCloudinary(thumbnailLocalPath);

  } catch (error) {

    throw new ApiError(
      500,
      "Error uploading video/thumbnail to Cloudinary: " + error.message
    );
  }

  let videoUpload;
  
  try {

    videoUpload = await Video.create({
      title,
      description,
      videoFile: videoFile.url,
      thumbnailFile: thumbnailFile.url,
      owner: user._id,
      isPublished: true,
      views: 0,
      duration: 0,

    });
      return res
        .status(201)
        .json(
          new ApiResponse(201, videoUpload, "Video published successfully")
        );

  } catch (error) {

    if(videoFile){
      await deleteFromCloudinary(videoFile?.public_id);
    }
    if(thumbnailFile){
      await deleteFromCloudinary(thumbnailFile?.public_id);
    }
    throw new ApiError(500, "Error  video: " + error.message);
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const user = req.user?._id;
  //TODO: get video by id

  if(!videoId || !isValidObjectId(videoId)){
    throw new ApiError(408, "Invalid video id");
  }

  const video = await Video.findById(videoId).select("owner");

  if (!video) {
     throw new ApiError(404, "Video not found");
  }

  try {
    if (user && user.toString() !== video.owner.toString()) {
       await Video.updateOne({ _id: videoId }, { $inc: { views: 1 } });
  
       await User.updateOne(
         { _id: user },
         { $addToSet: { watchHistory: videoId } }
       );
    }
  } catch (error) {
    throw new ApiError(408, "Error updating video counter");
    
  }

  try {
    const videoDetails = await Video.aggregate(
      [
        {
          $match: {
            _id: new mongoose.Types.ObjectId(videoId)
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "ownerDetails"
          }
        }, 
        {
          $unwind: "$ownerDetails"
        },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            videoFile: 1,
            thumbnailFile: 1,
            duration: 1,
            views: 1,
            createdAt: 1,
            updatedAt: 1,
            isPublished: 1,
            ownerDetails: {
              _id: "$ownerDetails._id",
              username: "$ownerDetails.username",
              email: "$ownerDetails.email",
              avatar: "$ownerDetails.avatar"
            }
          }
        }
      ]
    )
  
    return res
    .status(200)
    .json(new ApiResponse(200, videoDetails[0], "Video fetched successfully"));
  
  } catch (error) {
    throw new ApiError(408, "Error fetching video");
    
  }
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description, thumbnailFile } = req.body;
  //TODO: update video details like title, description, thumbnail

  const updateFields = {};

  if (title) updateFields.title =  title;
  if (description) updateFields.description = description;

  if(req.files?.thumbnailFile?.[0]){

    const thumbnailLocalPath = req.files.thumbnailFile[0].path;
    const thumbnail = await uploadToCloudinary(thumbnailLocalPath);
    if (!thumbnail?.url) {
      throw new ApiError(500, "Failed to upload thumbnail");
    }
    updateFields.thumbnailFile = thumbnail.url; 
  }

  if (Object.keys(updateFields).length === 0) {
    throw new ApiError(400, "No Valid fields to update, please give valid fields");
  }

  let updatedVideoDetails;
  try {
    
    updatedVideoDetails =  await Video.findByIdAndUpdate(
      videoId,
      { $set: updateFields },
      { new: true }
    );

      return res
        .status(200)
        .json(new ApiResponse(200, updatedVideoDetails, "Video updated successfully"));

  } catch (error) {

    if(thumbnailFile){
      await deleteFromCloudinary(thumbnailFile?.public_id);
    }

    throw new ApiError(408, "Error updating video");
  }

});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export { getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo,togglePublishStatus };

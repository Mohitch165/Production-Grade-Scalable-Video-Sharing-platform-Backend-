import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlists.model.js";
import { Video } from "../models/videos.model.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const user =  req.user?._id;

  if(!name) {
    throw new ApiError(400, "Name is required");
  }

  if(!description) {
    throw new ApiError(400, "Description is required");
  }

  if(!user || !isValidObjectId(user)) {
    throw new ApiError(400, "Invalid user id");
  }

  try {
    const playlist = await Playlist.create({
      name,
      description,
      owner: user
    })

    if(!playlist) {
      throw new ApiError(500, "Error creating playlist");
    }

    return res.status(201).json(new ApiResponse(201, playlist, "Playlist created successfully"));
  } catch (error) {
    console.log("Error creating playlist", error);
    throw new ApiError(408, "Error creating playlist");
  }


});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists

  if(!userId || !isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  try {
    const getPlaylists = await Playlist.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $unwind: "$userDetails"
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          createdAt: 1,
          updatedAt: 1,
          owner: {
            _id: "$userDetails._id",
            username: "$userDetails.username",
            fullname: "$userDetails.fullname",
            email: "$userDetails.email",
            avatar: "$userDetails.avatar"
          }
        }
      }
    ])
  
    if(!getPlaylists) {
      throw new ApiError(500, "Error getting playlists");
    }
  
    return res.status(200).json(new ApiResponse(200, getPlaylists, "Playlists fetched successfully"));
  } catch (error) {
    throw new ApiError(408, "Error getting playlists");
  }
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id

  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  try {
    const getPlaylistId = await Playlist.findById(playlistId)

    if(!getPlaylistId) {
      throw new ApiError(500, "Error getting playlist");
    }

    return res.status(200).json(new ApiResponse(200, getPlaylistId, "Playlist fetched successfully"));
  } catch (error) {
    throw new ApiError(408, "Error getting playlist");
  }
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if(!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  if(!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const user = req.user?._id;

  if(!user || !isValidObjectId(user)) {
    throw new ApiError(400, "Invalid user id"); 
  }

  try {
    const playlist = await Playlist.findById(playlistId);
  
    if(!playlist) {
      throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== user.toString()) {
      throw new ApiError(403, "You are not authorized to add videos to this playlist");
    }

    const video = await Video.findById(videoId);

    if(!video) {
      throw new ApiError(404, "Video not found");
    }

       const isAlreadyAdded = playlist.videos.some(
         (vid) => vid._id.toString() === videoId
       );

       if (isAlreadyAdded) {
         throw new ApiError(400, "This video is already in the playlist");
       }

       

    playlist.videos.push(video);
    await playlist.save();
  
    return res
      .status(200)
      .json(new ApiResponse(200, playlist, "Video added to playlist successfully"));
  } catch (error) {
  console.error("Error adding video to playlist:", error);
  throw new ApiError(500, "Error adding video to playlist", {
    message: error.message,
  });
}

});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist

  if(!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  if(!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const user = req.user?._id;

  if(!user || !isValidObjectId(user)) {
    throw new ApiError(400, "Invalid user id"); 
  }

  try {
    const playlist = await Playlist.findOneAndUpdate(
      {
        _id: playlistId,
        owner: user,
      },
      {
        $pull: {
          videos: videoId
        }
      },
      {
        new: true
      }
    );
  
    if(!playlist) {
      throw new ApiError(404, "Playlist not found or you are not authorized to remove videos from this playlist");
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, playlist, "Video removed from playlist successfully"));
  } catch (error) {
    throw new ApiError(408, "Error removing video from playlist");
  }
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist

  if(!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  const user = req.user?._id;

  if(!user || !isValidObjectId(user)) {
    throw new ApiError(400, "Invalid user id"); 
  }

  try {
    const playlist = await Playlist.findById(playlistId);
  
    if(!playlist) {
      throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== user.toString()) {
      throw new ApiError(403, "You are not authorized to delete this playlist");
    }

    await Playlist.deleteOne({ _id: playlistId });
  
    return res
      .status(200)
      .json(new ApiResponse(200, playlist, "Playlist deleted successfully"));
  } catch (error) {
    throw new ApiError(408, "Error deleting playlist");
  }
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist

  if(!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  const user = req.user?._id;

  if(!user || !isValidObjectId(user)) {
    throw new ApiError(400, "Invalid user id"); 
  }

  if(!name) {
    throw new ApiError(400, "Name is required");
  }

  if(!description) {
    throw new ApiError(400, "Description is required");
  }

  try {
    const playlist = await Playlist.findOneAndUpdate(
      {
        _id: playlistId,
        owner: user,
      },
      {
        name,
        description
      },
      {
        new: true
      }
    );
  
    if(!playlist) {
      throw new ApiError(404, "Playlist not found or you are not authorized to update this playlist");
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, playlist, "Playlist updated successfully"));
  } catch (error) {
    throw new ApiError(408, "Error updating playlist");
  }
});




export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};

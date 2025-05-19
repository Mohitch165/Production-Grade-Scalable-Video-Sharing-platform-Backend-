import { Router } from "express";

import { verifyJWT } from "../middleware/auth.middlewares.js";

import { createPlaylist, getUserPlaylists, getPlaylistById, addVideoToPlaylist, removeVideoFromPlaylist, deletePlaylist, updatePlaylist } from "../controllers/playlist.controller.js";

const router = Router();

router.route("/createPlaylist").post(verifyJWT, createPlaylist);
router.route("/getUserPlaylists/:userId").get(verifyJWT, getUserPlaylists);
router.route("/getPlaylistById/:playlistId").get(verifyJWT, getPlaylistById);
router.route("/addVideoToPlaylist/:playlistId/:videoId").post(verifyJWT, addVideoToPlaylist);
router.route("/removeVideoFromPlaylist/:playlistId/:videoId").delete(verifyJWT, removeVideoFromPlaylist);
router.route("/deletePlaylist/:playlistId").delete(verifyJWT, deletePlaylist);
router.route("/updatePlaylist/:playlistId").patch(verifyJWT, updatePlaylist);

export default router;
import { Router } from "express";

import { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos } from "../controllers/like.controller.js";

import { verifyJWT } from "../middleware/auth.middlewares.js";

const router = Router();

router.route("/toggleVideoLike/:videoId").post(verifyJWT, toggleVideoLike);
router.route("/toggleCommentLike/:commentId").post(verifyJWT, toggleCommentLike);
router.route("/toggleTweetLike/:tweetId").post(verifyJWT, toggleTweetLike);
router.route("/getLikedVideos/:userId").get(verifyJWT, getLikedVideos);

export default router;
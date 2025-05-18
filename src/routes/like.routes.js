import { Router } from "express";

import { toggleVideoLike, toggleCommentLike, toggleTweetLike } from "../controllers/like.controller.js";

import { verifyJWT } from "../middleware/auth.middlewares.js";

const router = Router();

router.route("/toggleVideoLike/:videoId").post(verifyJWT, toggleVideoLike);
router.route("/toggleCommentLike/:commentId").post(verifyJWT, toggleCommentLike);
router.route("/toggleTweetLike/:tweetId").post(verifyJWT, toggleTweetLike);

export default router;
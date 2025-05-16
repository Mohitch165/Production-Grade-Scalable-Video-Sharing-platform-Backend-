import { Router } from "express";

import { createTweet, getUserTweets } from "../controllers/tweet.controller.js";

import { verifyJWT } from "../middleware/auth.middlewares.js";

const router = Router();

router.route("/createTweet").post(verifyJWT, createTweet);
router.route("/getUserTweets/:userId").get(verifyJWT, getUserTweets);

export default router;
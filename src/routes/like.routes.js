import { Router } from "express";

import { toggleVideoLike } from "../controllers/like.controller.js";

import { verifyJWT } from "../middleware/auth.middlewares.js";

const router = Router();

router.route("/toggleVideoLike/:videoId").post(verifyJWT, toggleVideoLike);

export default router;
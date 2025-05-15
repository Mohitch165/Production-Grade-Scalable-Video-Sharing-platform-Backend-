import { Router } from "express";

import { getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus } from "../controllers/video.controller.js";

import { verifyJWT } from "../middleware/auth.middlewares.js";

import { upload } from "../middleware/multer.middlewares.js";

const router = Router();

router.route("/videos").get(verifyJWT, getAllVideos);
router.route("/uploadVideo").post(verifyJWT, upload.fields([
    {
        name: "thumbnailFile",
        maxCount: 1
    },
    {
        name: "videoFile",
        maxCount: 1
    }
]), publishAVideo)
router.route("/getVideo/:videoId").get(verifyJWT, getVideoById);

export default router;
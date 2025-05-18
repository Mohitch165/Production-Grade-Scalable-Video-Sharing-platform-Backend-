import { Router } from "express";

import { verifyJWT } from "../middleware/auth.middlewares.js";

import { addComment, deleteComment, updateComment, getVideoComments } from "../controllers/comment.controller.js";

const router = Router();

router.route("/createComment/:videoId").post(verifyJWT, addComment);
router.route("/getComments/:videoId").get(verifyJWT, getVideoComments);
router.route("/deleteComment/:commentId").delete(verifyJWT, deleteComment);
router.route("/updateComment/:commentId").patch(verifyJWT, updateComment);


export default router;
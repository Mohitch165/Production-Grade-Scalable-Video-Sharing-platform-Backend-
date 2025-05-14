import { Router } from "express";

import { registerUser, loginUser, logoutUser, changePassword, regenRefAccToken, updateUserDetails, getUserChannelDetails, watchHistory } from "../controllers/user.controller.js";

import { verifyJWT } from "../middleware/auth.middlewares.js";

import { upload } from "../middleware/multer.middlewares.js";

const router = Router();

router.route("/register").post(upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "banner",
        maxCount: 1
    }
]), registerUser);

router.route("/login").post(loginUser);
router.route("/regenerate-token").post(regenRefAccToken)
router.route("/logout").post(verifyJWT,logoutUser);
router.route("/change-password").post(verifyJWT, changePassword);
router.route("/update-details").post(verifyJWT, upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "banner",
        maxCount: 1
    }
]), updateUserDetails);

router.route("/channel/:username").get(verifyJWT, getUserChannelDetails);
router.route("/watch-history").get(verifyJWT, watchHistory);

export default router;
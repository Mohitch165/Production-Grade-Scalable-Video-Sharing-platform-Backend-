import { Router } from "express";

import { registerUser } from "../controllers/user.controller.js";

import { loginUser } from "../controllers/user.controller.js";

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

export default router;
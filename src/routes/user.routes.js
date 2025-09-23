import { Router } from "express";
import { loginUser,registerUser,logoutUser,refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccount, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory, removeFromWatchHistory, getMyChannelStats } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

//Secured routes -> after login
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-details").patch(verifyJWT,updateAccount)
router.route("/change-avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/change-coverImage").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)
router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
router.route("/watchHistory").get(verifyJWT,getWatchHistory)
router.route("/watchHistory/:videoId").delete(verifyJWT,removeFromWatchHistory)
router.route("/my-stats").get(verifyJWT,getMyChannelStats)

export default router
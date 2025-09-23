import { Router } from "express";
import {
    getAllTweets,
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { optionalAuth } from "../controllers/dashboard.controller.js";

const router = Router();

// Public routes with optional auth for enhanced features
router.route("/").get(optionalAuth, getAllTweets);
router.route("/user/:userId").get(optionalAuth, getUserTweets);

// Protected routes
router.use(verifyJWT); // Apply middleware to all routes below

router.route("/").post(createTweet);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router;
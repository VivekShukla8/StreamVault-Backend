import { Router } from "express";
import { getChannel, getChannelVideos, optionalAuth } from "../controllers/dashboard.controller.js";

const router = Router();

// Get channel info (public - optional auth for enhanced data)
router.get("/:channelId", optionalAuth, getChannel);

// Get videos for a channel (public - no auth required)
router.get("/:channelId/videos", getChannelVideos);

export default router;

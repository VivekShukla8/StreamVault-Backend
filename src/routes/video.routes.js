import { Router } from "express";
import { 
    getAllVideos,
    deleteVideo,
    togglePublishStatus,
    getVideoById,
    incrementVideoViews,
    uploadVideo,
    updateVideo
} from "../controllers/video.controller.js"
import { verifyJWT, optionalAuth } from "../middlewares/auth.middleware.js";

import multer from "multer";

const upload = multer({ dest: "uploads/" });

const router = Router();

// Public routes
router.get("/", getAllVideos);              // Get all videos with pagination, sorting, query
router.patch("/:videoId/views", optionalAuth, incrementVideoViews); // Increment video views with optional auth
router.get("/:videoId", getVideoById);      // Get a single video by id (public)

// Protected routes
router.post("/", verifyJWT, uploadVideo);   // Upload a new video

router.patch("/:videoId", verifyJWT, updateVideo);

router.delete("/:videoId", verifyJWT, deleteVideo); // Delete video (owner only)

router.patch("/:videoId/toggle", verifyJWT, togglePublishStatus); // Toggle publish/unpublish

export default router;

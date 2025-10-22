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
// video.routes.js - Refactored Protected route for POST /
router.post(
    "/",
    verifyJWT,
    upload.fields([
        { name: "videoFile", maxCount: 1 }, // Changed from 'videofile' to 'videoFile' for clarity
        { name: "thumbnail", maxCount: 1 }
    ]),
    uploadVideo // This controller now receives req.files
);

router.patch("/:videoId", verifyJWT, updateVideo);

router.delete("/:videoId", verifyJWT, deleteVideo); // Delete video (owner only)

router.patch("/:videoId/toggle", verifyJWT, togglePublishStatus); // Toggle publish/unpublish

export default router;

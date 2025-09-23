import { Router } from "express";
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Create playlist (user must be logged in)
router.post("/", verifyJWT, createPlaylist);

// Get all playlists of a user
router.get("/user/:userId", getUserPlaylists);

// Get a specific playlist by Id (with videos populated)
router.get("/:playlistId", getPlaylistById);

// Add video to a playlist
router.post("/:playlistId/videos/:videoId", verifyJWT, addVideoToPlaylist);

// Remove video from a playlist
router.delete("/:playlistId/videos/:videoId", verifyJWT, removeVideoFromPlaylist);

// Update playlist details
router.put("/:playlistId", verifyJWT, updatePlaylist);

// Delete playlist
router.delete("/:playlistId", verifyJWT, deletePlaylist);

export default router;

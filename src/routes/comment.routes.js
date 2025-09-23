import { Router } from "express";
import { 
    getVideoComments, 
    addComment, 
    updateComment, 
    deleteComment 
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Get all comments for a video (paginated, public)
router.get("/:videoId", getVideoComments);

// Add a comment to a video (protected)
router.post("/:videoId", verifyJWT, addComment);

// Update a comment (protected, owner only)
router.patch("/:commentId", verifyJWT, updateComment);

// Delete a comment (protected, owner only)
router.delete("/:commentId", verifyJWT, deleteComment);

export default router;
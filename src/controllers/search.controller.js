import mongoose from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import APIerror from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const searchVideosAndChannels = asyncHandler(async (req, res) => {
    const { query } = req.query;

    if (!query || query.trim().length === 0) {
        throw new APIerror(400, "Search query is required");
    }

    // Regex for case-insensitive partial matching
    const regex = new RegExp(query, "i");

    // Search videos
    const videos = await Video.find({
        isPublished: true,
        $or: [
            { title: { $regex: regex } },
            { description: { $regex: regex } }
        ]
    })
        .populate("owner", "username avatar")
        .select("_id title description thumbnail views createdAt owner");

    // Search channels (users)
    const channels = await User.find({
        $or: [
            { username: { $regex: regex } },
            { fullname: { $regex: regex } }
        ]
    }).select("_id username fullname avatar");

    return res.status(200).json(
        new ApiResponse(
            200,
            { videos, channels },
            "Search results fetched successfully"
        )
    );
});

export { searchVideosAndChannels };

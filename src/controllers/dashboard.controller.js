import mongoose from "mongoose";
import { Video } from "../models/video.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Likes } from "../models/likes.models.js";
import { User } from "../models/user.models.js";
import APIerror from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Optional JWT verification middleware - doesn't throw error if no token
const optionalAuth = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        
        if (token && token.trim() !== "") {
            const jwt = await import("jsonwebtoken");
            const decodedToken = jwt.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
            if (user) {
                req.user = user;
            }
        }
    } catch (error) {
        // Ignore auth errors for optional auth
        console.log("Optional auth failed:", error.message);
    }
    next();
});

// GET channel info and stats
const getChannel = asyncHandler(async (req, res) => {
    const {channelId} = req.params;

    if (!mongoose.isValidObjectId(channelId)) {
        throw new APIerror(400, "Invalid channel ID");
    }

    const channel = await User.findById(channelId).select("_id username fullname avatar coverImage bio createdAt");
    if (!channel) throw new APIerror(404, "Channel not found");

    // Convert channelId to ObjectId for proper comparison
    const channelObjectId = new mongoose.Types.ObjectId(channelId);
    
    // Stats
    const totalVideos = await Video.countDocuments({
        owner: channelObjectId,
        isPublished: req.user && req.user._id.equals(channelObjectId) ? undefined : true
    });

    const totalSubscribers = await Subscription.countDocuments({ channel: channelObjectId });

    const stats = { totalVideos, totalSubscribers };

    // Include likes / views only for own dashboard
    if (req.user && req.user._id.equals(channelObjectId)) {
        const videos = await Video.find({ owner: channelObjectId }).select("_id");
        const videoIds = videos.map(v => v._id);

        stats.totalLikes = videoIds.length > 0 ? await Likes.countDocuments({ video: { $in: videoIds } }) : 0;

        const viewsAgg = await Video.aggregate([
            { $match: { owner: channelObjectId } },
            { $group: { _id: null, totalViews: { $sum: "$views" } } }
        ]);
        stats.totalViews = viewsAgg.length > 0 ? viewsAgg[0].totalViews : 0;
    }

    return res.status(200).json(new ApiResponse(200, { channel, stats }, "Channel fetched successfully"));
});

// GET channel videos
const getChannelVideos = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!mongoose.isValidObjectId(channelId)) {
        throw new APIerror(400, "Invalid channel ID");
    }

    // Convert channelId to ObjectId for proper comparison
    const channelObjectId = new mongoose.Types.ObjectId(channelId);
    
    // Use aggregation to ensure owner population works
    const matchStage = {
        owner: channelObjectId,
        isPublished: true // Always show only published for now
    };
    
    // Use simple find first, then manually populate
    let videos;
    try {
        videos = await Video.find(matchStage)
            .sort({ createdAt: -1 })
            .lean();
            
        console.log('Raw videos found:', videos.length);
        if (videos.length > 0) {
            console.log('First video owner field:', videos[0].owner);
        }
        
        // Manually fetch user data for each video
        const transformedVideos = [];
        for (const video of videos) {
            let uploaderData = {
                _id: 'unknown',
                username: 'Unknown Channel',
                fullname: 'Unknown Channel',
                avatar: null
            };
            
            if (video.owner) {
                try {
                    const user = await User.findById(video.owner).select('username fullname avatar').lean();
                    if (user) {
                        uploaderData = {
                            _id: user._id,
                            username: user.username,
                            fullname: user.fullname,
                            avatar: user.avatar
                        };
                    }
                } catch (userError) {
                    console.error('Error fetching user for video:', video._id, userError);
                }
            }
            
            transformedVideos.push({
                ...video,
                uploader: uploaderData
            });
        }
        
        videos = transformedVideos;
        
    } catch (error) {
        console.error('Error in video fetch:', error);
        throw new APIerror(500, 'Failed to fetch videos with user data');
    }
    
    // Debug: Check what data we're sending
    console.log('=== DEBUG: Channel Videos Response ===');
    console.log('Channel ID:', channelId);
    console.log('Channel ObjectId:', channelObjectId);
    console.log('Number of videos found:', videos.length);
    if (videos.length > 0) {
        console.log('First video transformed data:', JSON.stringify(videos[0], null, 2));
        console.log('First video uploader field:', videos[0].uploader);
    } else {
        console.log('No videos found for this channel');
        // Let's also check if there are any videos at all for this owner
        const allVideos = await Video.find({ owner: channelObjectId });
        console.log('Total videos in DB for this owner:', allVideos.length);
        if (allVideos.length > 0) {
            console.log('First video from direct query:', allVideos[0]);
        }
    }

    return res.status(200).json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});

export { getChannel, getChannelVideos, optionalAuth };

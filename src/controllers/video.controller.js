import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.models.js"
import { User } from "../models/user.models.js"
import APIerror from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
import multer from "multer";

const upload = multer({ dest: "uploads/" });

const getAllVideos = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (isNaN(page) || page < 1) {
        throw new APIerror(400, "Page must be a positive integer");
    }
    if (isNaN(limit) || limit < 1 || limit > 100) {
        throw new APIerror(400, "Limit must be between 1 and 100");
    }

    const allowedSortFields = ["createdAt", "views", "title"];
    if (!allowedSortFields.includes(sortBy)) {
        throw new APIerror(400, "Invalid sort field");
    }
    sortType = sortType === "asc" ? 1 : -1;

    const match = {};
    if (query) {
        match.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ];
    }
    if (userId && mongoose.isValidObjectId(userId)) {
        match.owner = new mongoose.Types.ObjectId(userId);
        // If filtering by userId, show all videos (published and unpublished) if it's the user's own videos
        // For public viewing, still only show published videos
        if (!req.user || req.user._id.toString() !== userId) {
            match.isPublished = true;
        }
    } else {
        // For general video listing, only show published videos
        match.isPublished = true;
    }

    const pipeline = [
        { $match: match },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "uploader"
            }
        },
        { $unwind: "$uploader" },
        { $sort: { [sortBy]: sortType } },
        {
            $project: {
                _id: 1,
                title: 1,
                description: 1,
                thumbnail: 1,
                videofile: 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                "uploader._id": 1,
                "uploader.username": 1,
                "uploader.fullname": 1,
                "uploader.avatar": 1
            }
        },
        {
            $facet: {
                data: [
                    { $skip: (page - 1) * limit },
                    { $limit: limit }
                ],
                totalCount: [
                    { $count: "count" }
                ]
            }
        }
    ];

    const result = await Video.aggregate(pipeline);
    const videos = result[0]?.data || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                videos,
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            },
            "Videos fetched successfully"
        )
    );
})

const uploadVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    if (!title) throw new APIerror(400, "Title is required");

    const videoFiles = req.files?.videofile || req.files?.video || null;
    const thumbnailFiles = req.files?.thumbnail || req.files?.thumb || null;

    const videoFile = Array.isArray(videoFiles) ? videoFiles[0] : videoFiles;
    const thumbnailFile = Array.isArray(thumbnailFiles) ? thumbnailFiles[0] : thumbnailFiles;

    if (!videoFile || !thumbnailFile) {
        throw new APIerror(400, "Video and thumbnail are required");
    }

    let uploadedThumbnail;
    let uploadedVideo;

    try {
        uploadedThumbnail = await uploadOnCloudinary(thumbnailFile.path, {
            resource_type: "image",
            folder: "thumbnails"
        })
        
    } catch (error) {
        throw new APIerror(500, error?.message || "Error while uploading thumbnail image");
    }

    try {
        uploadedVideo = await uploadOnCloudinary(videoFile.path, {
            resource_type: "video",
            folder: "videos"
        })
        
    } catch (error) {
        throw new APIerror(500, error?.message || "Error while uploading video file");
    }

    if (!uploadedVideo?.url || !uploadedThumbnail?.url) {
        throw new APIerror(500, "Upload failed");
    }

    const video = await Video.create({
        title: title,
        description: description || "",
        videofile: uploadedVideo?.url,
        thumbnail: uploadedThumbnail?.url,
        videoPublicId: uploadedVideo?.public_id, // store public_id for deletion
        thumbnailPublicId: uploadedThumbnail?.public_id,
        duration: uploadedVideo.duration ?? 0,
        owner: req.user._id,
        isPublished: true
    })

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            video,
            "Video uploaded successfully"
        ))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new APIerror(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId)
        .populate("owner", "username email avatar")
        .select("-__v");

    if (!video) {
        throw new APIerror(404, "Video not found");
    }

    // Don't increment views here - create separate endpoint for that
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            video,
            "Video fetched successfully"
        ))
})

const incrementVideoViews = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new APIerror(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new APIerror(404, "Video not found");
    }

    // Increment video views
    video.views = (video.views || 0) + 1;
    await video.save();

    // Add to watch history if user is authenticated
    if (req.user) {
        try {
            const user = await User.findById(req.user._id);
            if (user) {
                // Remove video from history if it already exists (to avoid duplicates)
                user.watchHistory = user.watchHistory.filter(
                    (historyVideoId) => !historyVideoId.equals(videoId)
                );
                
                // Add video to the beginning of watch history
                user.watchHistory.unshift(videoId);
                
                // Keep only the last 100 videos in history for performance
                if (user.watchHistory.length > 100) {
                    user.watchHistory = user.watchHistory.slice(0, 100);
                }
                
                await user.save();
            }
        } catch (error) {
            console.error("Error updating watch history:", error);
            // Don't fail the request if watch history update fails
        }
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { 
                views: video.views,
                addedToHistory: !!req.user
            },
            "Views incremented successfully"
        ))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new APIerror(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new APIerror(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new APIerror(403, "You are not allowed to update this video");
    }

    const { title, description } = req.body;
    if (title) video.title = title;
    if (description) video.description = description;

    const thumbnailFile = req.file;
    if (thumbnailFile) {
        try {
            const uploadedThumbnail = await uploadOnCloudinary(thumbnailFile.path, {
                resource_type: "image",
                folder: "thumbnails",
            });
            fs.unlinkSync(thumbnailFile.path);
            video.thumbnail = uploadedThumbnail.url;
            video.thumbnailPublicId = uploadedThumbnail.public_id;
        } catch (error) {
            throw new APIerror(500, error?.message || "Error while uploading new thumbnail");
        }
    }

    await video.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            "Video updated successfully"
        )
    );
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new APIerror(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new APIerror(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new APIerror(403, "You are not allowed to delete this video");
    }

    // delete from Cloudinary
    try {
        if (video.videoPublicId) {
            await cloudinary.uploader.destroy(video.videoPublicId, { resource_type: "video" });
        }
        if (video.thumbnailPublicId) {
            await cloudinary.uploader.destroy(video.thumbnailPublicId);
        }
    } catch (error) {
        console.error("Cloudinary deletion error:", error.message);
    }

    await video.deleteOne();

    return res.status(200).json(
        new ApiResponse(
            200,
            null,
            "Video deleted successfully"
        )
    );
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new APIerror(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new APIerror(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new APIerror(403, "You are not allowed to change publish status of this video");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            `Video publish status updated to ${video.isPublished ? "published" : "unpublished"}`
        )
    );
})

export {
    getAllVideos,
    uploadVideo,
    getVideoById,
    incrementVideoViews,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}

import mongoose from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { Likes } from "../models/likes.models.js";
import { User } from "../models/user.models.js";
import APIerror from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Get all tweets with pagination
const getAllTweets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sortBy = "createdAt", sortType = "desc", userId } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum < 1) {
        throw new APIerror(400, "Page must be a positive integer");
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
        throw new APIerror(400, "Limit must be between 1 and 50");
    }

    const sortOrder = sortType === "asc" ? 1 : -1;
    const match = { isPublished: true };

    if (userId && mongoose.isValidObjectId(userId)) {
        match.owner = new mongoose.Types.ObjectId(userId);
    }

    const pipeline = [
        { $match: match },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        { $unwind: "$owner" },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                isLiked: {
                    $cond: {
                        if: req.user ? { $in: [new mongoose.Types.ObjectId(req.user._id), "$likes.likedBy"] } : false,
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                content: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1,
                createdAt: 1,
                updatedAt: 1
            }
        },
        { $sort: { [sortBy]: sortOrder } }
    ];

    const options = {
        page: pageNum,
        limit: limitNum,
        customLabels: {
            totalDocs: 'totalTweets',
            docs: 'tweets'
        }
    };

    const result = await Tweet.aggregatePaginate(Tweet.aggregate(pipeline), options);

    return res.status(200).json(
        new ApiResponse(200, result, "Tweets fetched successfully")
    );
});

// Create a new tweet
const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
        throw new APIerror(400, "Content is required");
    }

    if (content.length > 280) {
        throw new APIerror(400, "Tweet content cannot exceed 280 characters");
    }

    const tweet = await Tweet.create({
        content: content.trim(),
        owner: req.user._id,
        isPublished: true  // Explicitly set to true
    });

    const createdTweet = await Tweet.findById(tweet._id).populate("owner", "username fullname avatar");

    console.log("[CREATE] New tweet created:", {
        id: tweet._id,
        owner: req.user.username,
        isPublished: tweet.isPublished
    });

    return res.status(201).json(
        new ApiResponse(201, createdTweet, "Tweet created successfully")
    );
});

// Get user tweets
const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.isValidObjectId(userId)) {
        throw new APIerror(400, "Invalid user ID");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new APIerror(404, "User not found");
    }

    const matchCondition = {
        owner: new mongoose.Types.ObjectId(userId),
        isPublished: true
    };
    
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const pipeline = [
        { 
            $match: matchCondition
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        { $unwind: "$owner" },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                isLiked: {
                    $cond: {
                        if: req.user ? { $in: [new mongoose.Types.ObjectId(req.user._id), "$likes.likedBy"] } : false,
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                content: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1,
                createdAt: 1,
                updatedAt: 1
            }
        },
        { $sort: { createdAt: -1 } }
    ];

    const options = {
        page: pageNum,
        limit: limitNum,
        customLabels: {
            totalDocs: 'totalTweets',
            docs: 'tweets'
        }
    };

    const result = await Tweet.aggregatePaginate(Tweet.aggregate(pipeline), options);
    
    return res.status(200).json(
        new ApiResponse(200, result, "User tweets fetched successfully")
    );
});

// Update tweet
const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!mongoose.isValidObjectId(tweetId)) {
        throw new APIerror(400, "Invalid tweet ID");
    }

    if (!content || content.trim().length === 0) {
        throw new APIerror(400, "Content is required");
    }

    if (content.length > 280) {
        throw new APIerror(400, "Tweet content cannot exceed 280 characters");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new APIerror(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new APIerror(403, "You can only update your own tweets");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        { content: content.trim() },
        { new: true }
    ).populate("owner", "username fullname avatar");

    return res.status(200).json(
        new ApiResponse(200, updatedTweet, "Tweet updated successfully")
    );
});

// Delete tweet
const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!mongoose.isValidObjectId(tweetId)) {
        throw new APIerror(400, "Invalid tweet ID");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new APIerror(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new APIerror(403, "You can only delete your own tweets");
    }

    await Tweet.findByIdAndDelete(tweetId);

    // Also delete associated likes
    await Likes.deleteMany({ tweet: tweetId });

    return res.status(200).json(
        new ApiResponse(200, {}, "Tweet deleted successfully")
    );
});

export {
    getAllTweets,
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
};
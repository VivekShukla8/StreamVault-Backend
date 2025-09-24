import mongoose, {isValidObjectId} from "mongoose"
import {Likes} from "../models/likes.models.js"
import APIerror from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { Video } from "../models/video.models.js"
import asyncHandler from "../utils/asyncHandler.js"
import { Comment } from "../models/comment.models.js"
import {Tweet} from "../models/tweet.models.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Validate ObjectId
    if (!mongoose.isValidObjectId(videoId)) {
        throw new APIerror(400, "Invalid video ID");
    }

    const userId = req.user._id;

    // Ensure video exists
    const videoExists = await Video.findById(videoId);
    if (!videoExists) {
        throw new APIerror(404, "Video not found");
    }

    // Try to unlike if already liked
    const existingLike = await Likes.findOneAndDelete({ video: videoId, likedBy: userId });

    // Get updated like count
    const likeCount = await Likes.countDocuments({ video: videoId });

    if (existingLike) {
        return res.status(200).json(
            new ApiResponse(
                200,
                { isLiked: false, action: 'unliked', like:null, likeCount },
                "Video unliked successfully"
            )
        );
    }

    // Otherwise, create a new like
    const newLike = await Likes.create({
        video: videoId,
        likedBy: userId,
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            { isLiked: true, action: 'liked', like: newLike, likeCount },
            "Video liked successfully"
        )
    );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if(!mongoose.isValidObjectId(commentId)){
        throw new APIerror(400,"Invalid Comment Id.")
    }

   const userId = req.user._id;

    // Ensure comment exists
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new APIerror(404, "Comment not found");
    }

    // Already liked? → Unlike
    const existingLike = await Likes.findOneAndDelete({ comment: commentId, likedBy: userId });

    if (existingLike) {
        return res.status(200).json(
            new ApiResponse(
                200,
                { isLiked: false, action: 'unliked' },
                "Comment unliked successfully"
            )
        );
    }
     
    // Not liked yet
    const newLike = await Likes.create(
        {
            comment:commentId,
            likedBy:userId
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            { isLiked: true, action: 'liked', like: newLike },
            "Comment liked successfully."
        )
    )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    
    if(!mongoose.isValidObjectId(tweetId)){
        throw new APIerror(400,"Invalid tweet Id");
    }


    const userId = req.user._id;

    // Ensure tweet exists
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new APIerror(404, "Tweet not found");
    }

    // Already liked? → Unlike
    const existingLike = await Likes.findOneAndDelete({ tweet: tweetId, likedBy: userId });

    // Get updated like count
    const likeCount = await Likes.countDocuments({ tweet: tweetId });

    if (existingLike) {
        return res.status(200).json(
            new ApiResponse(
                200,
                { isLiked: false, action: 'unliked', likeCount },
                "Tweet unliked successfully"
            )
        );
    }

    const newLike = await Likes.create(
        {
            tweet:tweetId,
            likedBy:userId
        }
    )

    // Get updated like count after creating
    const updatedLikeCount = await Likes.countDocuments({ tweet: tweetId });

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            { isLiked: true, action: 'liked', likeCount: updatedLikeCount, like: newLike },
            "Tweet liked successfully."
        )
    )
})

const getLikedVideos = asyncHandler(async (req, res) => {
    const {userId} = req.params;

    if(!mongoose.isValidObjectId(userId)){
        throw new APIerror(400,"User Id is invalid");
    }

    const likedVideos = await Likes.aggregate([
        {
            $match:{
                likedBy:new mongoose.Types.ObjectId(userId),
                video:{ $ne :null}
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"videoDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        },
        { $unwind: "$videoDetails" },
        {
            $project: {
                _id: 0,
                likedAt: "$createdAt",
                video: "$videoDetails"
            }
        },
        { $sort: { likedAt: -1 } }
    ])

    // Transform the result to flatten the structure
    const formattedLikedVideos = likedVideos.map(item => ({
        ...item.video,
        likedAt: item.likedAt
    }));

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        formattedLikedVideos,
        "All liked videos fetched successfully."
    ))
})

// controller to check if current user has liked a video
const getVideoLikeStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new APIerror(400, "Invalid video ID");
    }

    const like = await Likes.findOne({
        video: videoId,
        likedBy: userId
    });

    // Get total like count for the video
    const likeCount = await Likes.countDocuments({ video: videoId });

    return res.status(200).json(
        new ApiResponse(
            200,
            { isLiked: !!like, likeCount },
            "Video like status fetched successfully"
        )
    );
});

// controller to check if current user has liked a comment
const getCommentLikeStatus = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;

    if (!mongoose.isValidObjectId(commentId)) {
        throw new APIerror(400, "Invalid comment ID");
    }

    const like = await Likes.findOne({
        comment: commentId,
        likedBy: userId
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            { isLiked: !!like },
            "Comment like status fetched successfully"
        )
    );
});

// controller to get like count for a video (public)
const getVideoLikeCount = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new APIerror(400, "Invalid video ID");
    }

    const likeCount = await Likes.countDocuments({ video: videoId });

    return res.status(200).json(
        new ApiResponse(
            200,
            { likeCount },
            "Video like count fetched successfully"
        )
    );
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getVideoLikeStatus,
    getCommentLikeStatus,
    getVideoLikeCount
}
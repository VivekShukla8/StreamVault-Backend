import mongoose from "mongoose"
import { Comment } from "../models/comment.models.js"
import APIerror from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"
import { isValidObjectId } from "mongoose"
import { User } from "../models/user.models.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    let { page = 1, limit = 10, sortBy = "createdAt", sortType = "desc" } = req.query;

    // Validate videoId
    if (!mongoose.isValidObjectId(videoId)) {
        throw new APIerror(400, "Invalid video ID");
    }

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);
    sortType = sortType === "asc" ? 1 : -1;

    const allowedSortFields = ["createdAt", "content"];
    if (!allowedSortFields.includes(sortBy)) {
        throw new APIerror(400, "Invalid sort field");
    }

    const pipeline = [
        { $match: { video: new mongoose.Types.ObjectId(videoId) } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        { $unwind: "$ownerDetails" },
        { $sort: { [sortBy]: sortType } },
        {
            $project: {
                _id: 1,
                content: 1,
                createdAt: 1,
                "ownerDetails._id": 1,
                "ownerDetails.username": 1,
                "ownerDetails.avatar": 1
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

    const result = await Comment.aggregate(pipeline);
    const comments = result[0]?.data || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                comments,
                page,
                limit,
                totalCount,
                totalPages
            },
            "Comments fetched successfully"
        )
    );
})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const owner = req.user._id;

    // Validate videoId
    if (!mongoose.isValidObjectId(videoId)) {
        throw new APIerror(400, "Invalid video ID");
    }

    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new APIerror(404, "Video not found");
    }

    // Validate content
    const { content } = req.body;
    if (!content || content.trim() === "") {
        throw new APIerror(400, "Comment content is required");
    }

    // Create comment
    const comment = await Comment.create({
        content,
        video: videoId,
        owner
    });

    return res
    .status(201)
    .json(
        new ApiResponse(
            201, 
            comment,
            "Comment added successfully")
    );
})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    const owner = req.user._id;

     // Validate commentId
    if (!mongoose.isValidObjectId(commentId)) {
        throw new APIerror(400, "Invalid comment ID");
    }

    // Find comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new APIerror(404, "Comment not found");
    }

    // Authorization check
    if (comment.owner.toString() !== owner.toString()) {
        throw new APIerror(403, "You are not allowed to edit this comment");
    }

    // Validate new content 
    const {content} = req.body;
    if(!content || content.trim()===""){
        throw new APIerror(400,"Comment content is required");
    }

    comment.content=content;
    await comment.save();


    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comment,
            "Comment updated successfully"
        )
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!mongoose.isValidObjectId(commentId)) {
        throw new APIerror(400, "Comment Id is invalid");
    }

    const user = req.user._id;

    // Find comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new APIerror(404, "Comment not found");
    }

    // Authorization check
    if (comment.owner.toString() !== user.toString()) {
        throw new APIerror(403, "You are not allowed to delete this comment");
    }

    await comment.deleteOne();

    return res.status(200).json(
        new ApiResponse(
            200,
            null,
            "Comment deleted successfully"
        )
    );
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
}

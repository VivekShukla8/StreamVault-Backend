import mongoose from "mongoose"
import { MessageRequest } from "../models/MessageRequest.model.js"
import { Conversation } from "../models/Conversation.model.js"
import { Message } from "../models/Message.model.js"
import { getIo } from "../socket.js"
import APIerror from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

const createRequest = asyncHandler(async (req, res) => {
    const io = getIo();
    const { receiverId, content } = req.body;
    const senderId = req.user._id;

    // Validate IDs
    if (!mongoose.isValidObjectId(receiverId)) {
        throw new APIerror(400, "Invalid receiver ID");
    }

    if (receiverId === String(senderId)) {
        throw new APIerror(400, "Cannot message yourself");
    }

    // Limit pending requests
    const existingPending = await MessageRequest.countDocuments({
        sender: senderId,
        receiver: receiverId,
        status: "pending",
    });
    if (existingPending >= 3) {
        throw new APIerror(429, "Too many requests to this user. Try later.");
    }

    // Check existing conversation
    const existingConv = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] },
    });
    if (existingConv) {
        throw new APIerror(400, "Conversation already exists");
    }

    // Check if a request already exists (pending OR accepted)
    const existingRequest = await MessageRequest.findOne({
        sender: senderId,
        receiver: receiverId,
        status: { $in: ["pending", "accepted"] },
    });
    if (existingRequest) {
        throw new APIerror(400, "Request already sent");
    }

    // Create new request
    try {
        const mr = await MessageRequest.create({
            sender: senderId,
            receiver: receiverId,
            content,
        });

        // Notify receiver
        io.to(String(receiverId)).emit("new_message_request", { request: mr });

        return res
            .status(201)
            .json(new ApiResponse(201, mr, "Message request created successfully"));
    } catch (err) {
        if (err.code === 11000) {
            // Duplicate index violation
            throw new APIerror(400, "Request already sent");
        }
        throw err;
    }
});

const getRequestsForReceiver = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const requests = await MessageRequest.find({
        receiver: userId,
        status: "pending",
    }).populate("sender", "username avatar");

    return res
        .status(200)
        .json(new ApiResponse(200, requests, "Requests fetched successfully"));
});

const respondToRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // 'accept' | 'decline'
    const userId = req.user._id;
    const io = getIo();

    if (!mongoose.isValidObjectId(id)) {
        throw new APIerror(400, "Invalid request ID");
    }

    const mr = await MessageRequest.findById(id);
    if (!mr) {
        throw new APIerror(404, "Message request not found");
    }

    if (String(mr.receiver) !== String(userId)) {
        throw new APIerror(403, "Not authorized to respond to this request");
    }

    if (mr.status !== "pending") {
        throw new APIerror(400, "This request has already been handled");
    }

    if (action === "decline") {
        mr.status = "declined";
        await mr.save();

        io.to(String(mr.sender)).emit("message_request_response", {
            requestId: id,
            status: "declined",
        });

        return res
            .status(200)
            .json(new ApiResponse(200, null, "Message request declined"));
    }

    // Accept
    const conv = await Conversation.create({
        participants: [mr.sender, mr.receiver],
    });

    const msg = await Message.create({
        conversation: conv._id,
        sender: mr.sender,
        content: mr.content,
    });

    conv.lastMessage = msg._id;
    await conv.save();

    mr.status = "accepted";
    await mr.save();

    io.to(String(mr.sender)).emit("message_request_response", {
        requestId: id,
        status: "accepted",
        conversationId: conv._id,
    });
    io.to(String(mr.receiver)).emit("conversation_created", {
        conversationId: conv._id,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(200, { conversationId: conv._id }, "Message request accepted")
        );
});

export { 
    createRequest, 
    getRequestsForReceiver, 
    respondToRequest
};

import mongoose from "mongoose";
import { Conversation } from "../models/Conversation.model.js";
import { Message } from "../models/Message.model.js";
import { getIo } from "../socket.js";
import APIerror from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";


const getConversations = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const io = getIo();

    const convs = await Conversation.find({ participants: userId })
        .populate("participants", "username avatar")
        .populate("lastMessage");


    return res
        .status(200)
        .json(new ApiResponse(200, convs, "Conversations fetched successfully"));
});

const getMessages = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const io = getIo();

    if (!mongoose.isValidObjectId(id)) {
        throw new APIerror(400, "Invalid conversation ID");
    }

    const conv = await Conversation.findById(id);
    if (!conv || !conv.participants.includes(String(req.user._id))) {
        throw new APIerror(403, "Access denied");
    }

    const messages = await Message.find({ conversation: id })
        .sort("createdAt")
        .populate("sender", "username avatar");

    return res
        .status(200)
        .json(new ApiResponse(200, messages, "Messages fetched successfully"));
});

const sendMessage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user._id;
    const io = getIo();

    if (!mongoose.isValidObjectId(id)) {
        throw new APIerror(400, "Invalid conversation ID");
    }

    if (!content || content.trim() === "") {
        throw new APIerror(400, "Message content is required");
    }

    const conv = await Conversation.findById(id);
    if (!conv || !conv.participants.includes(String(userId))) {
        throw new APIerror(403, "Access denied");
    }

    const msg = await Message.create({ conversation: id, sender: userId, content });
    conv.lastMessage = msg._id;
    conv.updatedAt = Date.now();
    await conv.save();

    const populated = await msg.populate("sender", "username avatar");

     // Debug log
    console.log("📨 Message saved, emitting to conversation room & participants:", {
        conversationId: id,
        messageId: populated._id,
        participants: conv.participants,
    });


    // Emit to conversation room (clients that joined the conversation)
    try {
        io.to(String(id)).emit("new_message", { conversationId: id, message: populated });
    } catch (err) {
        console.warn("Could not emit to conversation room:", err);
    }

    // Emit to each participant personal room (for clients that joined personal rooms)
    conv.participants.forEach((p) => {
        try {
        io.to(String(p)).emit("new_message", { conversationId: id, message: populated });
        } catch (e) {
        // swallow per-participant emit errors
        }
    });

    return res.status(201).json(new ApiResponse(201, populated, "Message sent successfully"));
});

export { getConversations, getMessages, sendMessage };

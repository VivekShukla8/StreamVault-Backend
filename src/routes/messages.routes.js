import { Router } from "express";

import { 
  createRequest, 
  getRequestsForReceiver, 
  respondToRequest 
} from "../controllers/messageRequest.controller.js";
import { 
  getConversations, 
  getMessages, 
  sendMessage 
} from "../controllers/conversation.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { Conversation } from "../models/Conversation.model.js";
import { MessageRequest } from "../models/MessageRequest.model.js"; // Add this import

const router = Router();

// message requests
router.post("/requests", verifyJWT, createRequest);
router.get("/requests", verifyJWT, getRequestsForReceiver);
router.patch("/requests/:id", verifyJWT, respondToRequest);

// conversations & messages
router.get("/conversations", verifyJWT, getConversations);
router.get("/conversations/:id/messages", verifyJWT, getMessages);
router.post("/conversations/:id/messages", verifyJWT, sendMessage);

// Check request/conversation status
router.get("/requests/:receiverId/check", verifyJWT, async (req, res) => {
  try {
    const sender = req.user._id;
    const receiver = req.params.receiverId;

    // First, check if a request exists with pending/accepted
    const reqDoc = await MessageRequest.findOne({
      sender,
      receiver,
      status: { $in: ["pending", "accepted"] },
    });

    if (reqDoc) {
      // if accepted -> return conversation id if exists
      if (reqDoc.status === "accepted") {
        const conv = await Conversation.findOne({
          participants: { $all: [sender, receiver] },
        });
        return res.json({ 
          status: "accepted", 
          conversationId: conv?._id || null 
        });
      }
      // pending
      return res.json({ status: "pending" });
    }

    // No request found — double-check if conversation exists (maybe accepted earlier)
    const conv = await Conversation.findOne({
      participants: { $all: [sender, receiver] },
    });
    if (conv) {
      return res.json({ 
        status: "accepted", 
        conversationId: conv._id 
      });
    }

    // nothing exists
    return res.json({ status: "none" });
  } catch (err) {
    console.error("Error checking message request:", err);
    return res.status(500).json({ 
      status: "error",
      message: "Error checking request" 
    });
  }
});

export default router;
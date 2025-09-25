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

const router = Router();

// message requests
router.post("/requests", verifyJWT, createRequest);
router.get("/requests", verifyJWT, getRequestsForReceiver);
router.patch("/requests/:id", verifyJWT, respondToRequest);       // here id is request id

// conversations & messages
router.get("/conversations", verifyJWT, getConversations);
router.get("/conversations/:id/messages", verifyJWT, getMessages);
router.post("/conversations/:id/messages", verifyJWT, sendMessage);

export default router;

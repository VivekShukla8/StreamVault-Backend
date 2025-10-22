import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
         process.env.FRONTEND_URL
      ].filter(Boolean),
      credentials: true,
      methods: ["GET", "POST"]
    },
  });

  // Debug middleware
  io.use((socket, next) => {
    console.log('🔐 Socket authentication attempt:', {
      auth: socket.handshake.auth,
      query: socket.handshake.query,
      headers: socket.handshake.headers.authorization
    });

    // Try multiple token sources
    let token = socket.handshake.auth?.token || 
                socket.handshake.query?.token ||
                socket.handshake.headers?.authorization;
    
    if (!token) {
      console.log('❌ No token found in auth, query, or headers');
      return next(new Error("No token provided"));
    }

    try {
      // Clean token format
      const cleanToken = token.replace("Bearer ", "");
      console.log('🔍 Attempting to verify token...');
      
      const payload = jwt.verify(cleanToken, process.env.ACCESS_TOKEN_SECRET);
      console.log('✅ Token verified successfully:', {
        userId: payload.id || payload._id || payload.userId,
        username: payload.username || payload.name,
        exp: new Date(payload.exp * 1000)
      });
      
      // Store user info on socket
      socket.userId = payload.id || payload._id || payload.userId;
      socket.username = payload.username || payload.name;
      
      if (!socket.userId) {
        console.log('❌ No user ID found in token payload');
        return next(new Error("Invalid token payload"));
      }
      
      return next();
    } catch (err) {
      console.log('❌ Token verification failed:', {
        error: err.message,
        tokenStart: token.substring(0, 20) + '...'
      });
      return next(new Error("Invalid token: " + err.message));
    }
  });

  io.on("connection", (socket) => {
    console.log('🔗 Socket connected successfully:', {
      socketId: socket.id,
      userId: socket.userId,
      username: socket.username
    });
    

    // Join user to their personal room
    if (socket.userId) {
      socket.join(String(socket.userId));
      console.log(`👤 User ${socket.userId} joined personal room`);
    }

    // Handle conversation joining
    socket.on('join_conversation', (conversationId) => {
      console.log(`🏠 User ${socket.userId} joining conversation: ${conversationId}`);
      socket.join(conversationId);
      socket.emit('joined_conversation', { conversationId, success: true });
    });

    // Handle conversation leaving
    socket.on('leave_conversation', (conversationId) => {
      console.log(`🚪 User ${socket.userId} leaving conversation: ${conversationId}`);
      socket.leave(conversationId);
    });

     // ✅ Handle new messages
    socket.on("send_message", (msg) => {
      console.log("💬 New message received:", msg);
      // Broadcast to all participants in the conversation
      io.to(msg.conversationId).emit("new_message", msg);
    });

    // Test event
    socket.on('test_connection', (data) => {
      console.log('🧪 Test connection received:', data);
      socket.emit('test_response', { 
        message: 'Connection successful!', 
        userId: socket.userId,
        timestamp: new Date().toISOString()
      });
    });

    socket.on("disconnect", (reason) => {
      console.log('🔌 Socket disconnected:', {
        socketId: socket.id,
        userId: socket.userId,
        reason
      });
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) throw new Error("Socket.io not initialized yet!");
  return io;
};

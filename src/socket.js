// src/socket.js
import { Server } from "socket.io";

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        process.env.FRONTEND_URL
      ].filter(Boolean),
      credentials: true,
    },
  });

  // Authenticate sockets with JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token provided"));

    try {
      const payload = require("jsonwebtoken").verify(
        token.replace("Bearer ", ""),
        process.env.ACCESS_TOKEN_SECRET
      );
      socket.userId = payload.id;
      return next();
    } catch (err) {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.userId);
    if (socket.userId) socket.join(String(socket.userId));

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.userId);
    });
  });

  return io;
};

// Return the io instance (after initialization)
export const getIo = () => {
  if (!io) throw new Error("Socket.io not initialized yet!");
  return io;
};

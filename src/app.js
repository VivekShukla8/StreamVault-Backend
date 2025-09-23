import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
      'http://127.0.0.1:3000',
      // Add your Vercel frontend URL here
      process.env.FRONTEND_URL, // Set this in your backend deployment
    ];
    
    // Filter out undefined values
    const validOrigins = allowedOrigins.filter(Boolean);
    
    if (validOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // If CORS_ORIGIN is set in env, also allow that
    if (process.env.CORS_ORIGIN && origin === process.env.CORS_ORIGIN) {
      return callback(null, true);
    }
    
    // Allow any vercel.app domain for development
    if (origin && (origin.includes('.vercel.app') || origin.includes('.netlify.app'))) {
      return callback(null, true);
    }
    
    // For production, log the blocked origin for debugging
    console.log('Blocked origin:', origin);
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie']
}))

app.use(express.json({limit: "56kb" }))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes import
import userRouter from  "./routes/user.routes.js"

//routes declaration
app.use("/api/v1/users",userRouter)

// video routes
import videoRouter from "./routes/video.routes.js"
app.use("/api/v1/videos", videoRouter);

// comment routes
import commentRouter from "./routes/comment.routes.js"
app.use("/api/v1/comments", commentRouter);

// Tweet routes
import tweetRouter from "./routes/tweet.routes.js"
app.use("/api/v1/tweets",tweetRouter)

// Subscription routes
import subscriptionRouter from "./routes/subscription.routes.js"
app.use("/api/v1/subscriptions",subscriptionRouter)

// Likes routes
import likesRouter from "./routes/likes.routes.js";
app.use("/api/v1/likes", likesRouter);

// Healthcheck route
import healthcheckRouter from "./routes/healthcheck.routes.js";
app.use("/api/v1/healthcheck", healthcheckRouter);

// Playlist routes
import playlistRouter from "./routes/playlist.routes.js";
app.use("/api/v1/playlists", playlistRouter);

// Dashboard/Channel routes
import channelRouter from "./routes/channels.routes.js";
app.use("/api/v1/channels", channelRouter);

// Search routes
import searchRoutes from "./routes/search.routes.js";
app.use("/api/v1/search", searchRoutes);


export default app;
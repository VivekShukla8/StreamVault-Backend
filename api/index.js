import app from '../src/app.js';
import connectDB from '../src/db/index.js';

// Connect to database once when the function starts
let dbConnected = false;

const connectToDatabase = async () => {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }
};

// Wrap app in a function that ensures DB is ready
const handler = async (req, res) => {
  try {
    await connectToDatabase();
    return app(req, res);
  } catch (error) {
    console.error("Handler error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};

export default handler; // ✅ Vercel-compatible
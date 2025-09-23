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

// Export the handler for Vercel
export default async function handler(req, res) {
  try {
    // Ensure database is connected
    await connectToDatabase();
    
    // Handle the request with your Express app
    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
}
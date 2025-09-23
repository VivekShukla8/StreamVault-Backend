import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        // Check if already connected (important for serverless)
        if (mongoose.connections[0].readyState) {
            console.log('Already connected to MongoDB');
            return;
        }
        
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`, {
            bufferCommands: false,
        });
        console.log(`\n MongoDb connected. DB host: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MongoDB connection error:", error);
        throw error; // Don't exit process in serverless
    }
}    

export default connectDB;
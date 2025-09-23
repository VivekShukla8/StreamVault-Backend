import asyncHandler from "../utils/asyncHandler.js";
import APIerror from "../utils/apiError.js";
import jwt from "jsonwebtoken" 
import { User } from "../models/user.models.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        // Stop here if token is missing or empty
        if (!token || token.trim() === "") {
            throw new APIerror(401, "Unauthorized request: No token provided");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        );

        if (!user) {
            throw new APIerror(401, "Invalid access token: user not found");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new APIerror(401, error?.message || "Invalid authorized request");
    }
});

// Optional JWT verification middleware - doesn't throw error if no token
export const optionalAuth = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        
        if (token && token.trim() !== "") {
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
            if (user) {
                req.user = user;
                console.log('✅ Optional auth successful for user:', user._id);
            }
        } else {
            console.log('ℹ️ No token provided - continuing without auth');
        }
    } catch (error) {
        console.log('⚠️ Optional auth failed:', error.message);
    }
    next();
});

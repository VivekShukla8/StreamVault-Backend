import express from "express";
import { v2 as cloudinary } from "cloudinary";
import asyncHandler from "../utils/asyncHandler.js";
import crypto from "crypto"; // <-- you missed this import

const router = express.Router();

router.get("/sign-upload", async (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = req.query.folder || ""; // pass folder from frontend

    // build params string (MUST match frontend formData fields)
    let paramsToSign = `timestamp=${timestamp}`;
    if (folder) {
      paramsToSign = `folder=${folder}&${paramsToSign}`;
    }

    const signature = crypto
      .createHash("sha1")
      .update(paramsToSign + process.env.CLOUDINARY_API_SECRET)
      .digest("hex");

    res.json({
      timestamp,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate signature" });
  }
});

export default router;

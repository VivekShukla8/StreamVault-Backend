import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import APIerror from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        throw new APIerror(400, "Name and description are required");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id,
    });

    return res.status(201).json(
        new ApiResponse(201, playlist, "Playlist created successfully")
    );
});

 
const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new APIerror(400, "Invalid User Id");
    }

    const playlists = await Playlist.find({ owner: userId });

    return res.status(200).json(
        new ApiResponse(200, playlists, "All playlists fetched successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new APIerror(400, "Invalid playlistId");
    }

    const playlist = await Playlist.findById(playlistId).populate("videos");

    if (!playlist) {
        throw new APIerror(404, "Playlist not found");
    }

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new APIerror(400, "Invalid playlistId or videoId");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new APIerror(404, "Playlist not found");
    }

    // check if video exists in DB
    const video = await Video.findById(videoId);
    if (!video) {
        throw new APIerror(404, "Video not found");
    }

    if (playlist.videos.includes(videoId)) {
        throw new APIerror(400, "Video already in playlist");
    }

    playlist.videos.push(videoId);
    await playlist.save();

    const updated = await Playlist.findById(playlistId).populate("videos");

    return res.status(200).json(
        new ApiResponse(200, updated, "Video added to playlist successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new APIerror(400, "Invalid playlistId or videoId");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new APIerror(404, "Playlist not found");
    }

    if (!playlist.videos.includes(videoId)) {
        throw new APIerror(400, "Video not found in this playlist");
    }

    playlist.videos = playlist.videos.filter(
        (id) => id.toString() !== videoId.toString()
    );

    await playlist.save();
    const updated = await Playlist.findById(playlistId).populate("videos");

    return res.status(200).json(
        new ApiResponse(200, updated, "Video removed from playlist successfully")
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new APIerror(400, "Invalid playlistId");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new APIerror(404, "Playlist not found");
    }

    await Playlist.findByIdAndDelete(playlistId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Playlist deleted successfully")
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!isValidObjectId(playlistId)) {
        throw new APIerror(400, "Invalid playlistId");
    }

    if (!name && !description) {
        throw new APIerror(400, "Name or description required to update");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $set: { ...(name && { name }), ...(description && { description }) } },
        { new: true }
    ).populate("videos");

    if (!updatedPlaylist) {
        throw new APIerror(404, "Playlist not found");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
    );
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
};

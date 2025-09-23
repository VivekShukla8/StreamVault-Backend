import { Router } from "express";
import { searchVideosAndChannels } from "../controllers/search.controller.js";

const router = Router();

// /api/v1/search?query=keyword
router.get("/", searchVideosAndChannels);

export default router;

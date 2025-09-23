import APIerror from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import  asyncHandler  from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, { 
            status: "OK", 
            message: "Server is healthy",
            timestamp: new Date().toISOString()
        }, "Healthcheck successful"));
});

export { healthcheck };

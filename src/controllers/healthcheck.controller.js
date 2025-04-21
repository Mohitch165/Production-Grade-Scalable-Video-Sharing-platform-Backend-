import { ApiResponse } from "../util/ApiResponse.js";

import { asyncHandler } from "../util/asyncHandler.js";

const healthCheck = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, "OK", "Server is up and running"));
})

export { healthCheck }
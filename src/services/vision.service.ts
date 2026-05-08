import { ENV } from "../config/env";

function getVisionStatus() {
    return { visionConfigured: Boolean(ENV.GOOGLE_CLOUD_VISION_API_KEY) }
}

export const visionService = { getVisionStatus }
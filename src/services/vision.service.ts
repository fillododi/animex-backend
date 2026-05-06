import { ENV } from "../config/env";

export function getVisionStatus() {
    return { visionConfigured: Boolean(ENV.GOOGLE_CLOUD_VISION_API_KEY) }
}
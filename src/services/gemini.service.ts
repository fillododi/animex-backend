import { ENV } from "../config/env";

export function getGeminitatus() {
    return { geminiConfigured: Boolean(ENV.GEMINI_API_KEY) }
}
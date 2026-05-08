import { ENV } from "../config/env";

function getGeminiStatus() {
    return { geminiConfigured: Boolean(ENV.GEMINI_API_KEY) }
}

export const geminiService = { getGeminiStatus }
import { ENV } from "../config/env";
import { AppError } from "../middleware/errorHandler";

function getGeminiStatus() {
    return { geminiConfigured: Boolean(ENV.GEMINI_API_KEY) }
}

async function generateText(prompt: string, timeoutMs?: number): Promise<string> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
        const requestBody = { contents: [{ parts: [{ text: prompt }], role: "user" }] }
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${ENV.GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody) 
        })
        if(!response.ok) {
            throw new AppError({
                statusCode: 503,
                code: "SERVICE_UNAVAILABLE",
                message: `Gemini returned HTTP ${response.status}.`
            })
        }
        const json = await response.json()
        const responseData = json?.candidates?.[0]?.content
        if(!responseData) return "";
        const text = responseData.parts?.map((part: { text?: string }) => part.text ?? "").join(" ").trim()
        if(!text) return "";
        return text
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            throw new AppError({
                statusCode: 504,
                code: "VISION_TIMEOUT",
                message: "Gemini request timed out"
            })
        }
        throw new AppError({
            statusCode: 503,
            code: "SERVICE_UNAVAILABLE",
            message: "Gemini is unavailable"
        })
    } finally {
        clearTimeout(timeout);
    }
}

export const geminiService = { getGeminiStatus, generateText }
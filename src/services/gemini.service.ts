import { ENV } from "../config/env";
import { AppError } from "../middleware/errorHandler";

type GeminiRole = "user" | "model"

interface GeminiMessage {
    role: GeminiRole,
    text: string
}

interface GenerateTextOptions {
    systemInstruction?: string,
    history?: GeminiMessage[],
    temperature?: number,
    maxOutputTokens?: number,
    timeoutMs?: number
}

interface GeminiUsage {
    promptTokenCount?: number,
    candidatesTokenCount?: number,
    totalTokenCount?: number
}

interface GeminiTextResult {
    text: string,
    model: string,
    usage?: GeminiUsage
}

interface GeminiApiResponse {
    candidates?: Array<{ content?: { role?: string, parts?: Array<{ text?: string }> }, finishReason?: string }>,
    usageMetadata?: GeminiUsage 
}

interface GeminiServiceConfig {
    apiKey: string,
    model?: string,
    baseUrl?: string,
    defaultTimeoutMs?: number
}

class GeminiService {
    private readonly defaultTimeoutMs: number
    private readonly apiKey: string
    private readonly model: string
    private readonly baseUrl: string

    constructor(config: GeminiServiceConfig) {
        if(!config.apiKey) {
            throw new AppError({ statusCode: 500, code: "SERVICE_UNAVAILABLE", message: "Gemini config error", details: "GEMINI_API_KEY is missing" })
        }
        this.apiKey = config.apiKey
        this.model = config.model ?? "gemini-2.0-flash"
        this.baseUrl = config.baseUrl ?? "https://generativelanguage.googleapis.com/v1beta"
        this.defaultTimeoutMs = config.defaultTimeoutMs ?? 3000
    }

    getGeminiStatus() {
        return { geminiConfigured: Boolean(ENV.GEMINI_API_KEY) }
    }

    async generateText(prompt: string, options: GenerateTextOptions = {}): Promise<GeminiTextResult> {
        const response = await this.callGemini(prompt, options)
        const text = this.extractText(response)
        return { text, model: this.model, usage: response.usageMetadata }
    }

    private async callGemini(prompt: string, options: GenerateTextOptions): Promise<GeminiApiResponse> {
        const controller = new AbortController()
        const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs
        const timeout = setTimeout(() => controller.abort(), timeoutMs)
        const url = `${this.baseUrl}/models/${encodeURIComponent(this.model)}:generateContent$key=${encodeURIComponent(this.apiKey)}`
        const body = { 
            systemInstruction: options.systemInstruction? { parts: [{ text: options.systemInstruction }] }: undefined,
            contents: this.buildContents(prompt, options.history),
            generationConfig: {
                temperature: options.temperature ?? 0.4,
                maxOutputTokens: options.maxOutputTokens ?? 512
            }
        }
        try {
            const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
            if(!response.ok) await this.handleBadResponse(response);
            return (await response.json()) as GeminiApiResponse
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                throw new AppError({
                    statusCode: 504,
                    code: "GEMINI_TIMEOUT",
                    message: "Gemini request timed out"
                })
            }
            throw new AppError({
                statusCode: 503,
                code: "SERVICE_UNAVAILABLE",
                message: "Gemini is unavailable"
            })
        } finally {
            clearTimeout(timeout)
        }
    }

    private buildContents(prompt: string, history: GeminiMessage[] = []) {
        const contents = history.map(message => ({ role: message.role, parts: [{ text: message.text }] }))
        contents.push({ role: "user", parts: [{ text: prompt }] })
        return contents
    }

    private async handleBadResponse(response: Response): Promise<never> {
        let message = `Gemini returned HTTP ${response.status}.`
        try {
            const body = (await response.json()) as { error?: { message?: string } }
            if (body.error?.message) message = body.error.message;
        } catch {
            // Keep generic message.
        }
        if (response.status === 429 || response.status === 503) {
            throw new AppError({ statusCode: 503, code: "SERVICE_UNAVAILABLE", message: "Gemini unavailable", details: message })
        }
        if (response.status === 408 || response.status === 504) {
            throw new AppError({ statusCode: 504, code: "GEMINI_TIMEOUT", message })
        }
        throw new AppError({ statusCode: 500, code: "SERVICE_UNAVAILABLE", message: "Gemini unavailable" })
    }

    private extractText(response: GeminiApiResponse): string {
        const candidate = response.candidates?.[0]
        if (!candidate) throw new AppError({ statusCode: 502, code: "VALIDATION_ERROR", message: "Gemini returned no candidates" });
        if (candidate.finishReason === "SAFETY") {
            throw new AppError({ statusCode: 502, code: "VALIDATION_ERROR", message: "Gemini blocked the responses for safety reasons" })
        }
        const text = candidate.content?.parts?.map(part => part.text ?? "").join("").trim() ?? ""
        return text
    }
}

export const geminiService = new GeminiService({ apiKey: ENV.GEMINI_API_KEY })
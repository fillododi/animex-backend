import { ENV } from "../config/env";
import { AppError } from "../middleware/errorHandler";

type GeminiRole = "user" | "model"

export interface GeminiMessage {
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

interface GenerateJsonOptions extends GenerateTextOptions {
    schemaName?: string
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
        this.model = config.model ?? "gemini-3.5-flash"
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

    async generateJson<T>(prompt: string, options: GenerateJsonOptions = {}): Promise<T> {
        const jsonPrompt = [
            prompt, 
            "", 
            "Return ONLY valid JSON.", 
            "Do not wrap the JSON in markdown.", 
            "Do not include explanations before or after the JSON."
        ].join("\n")
        const result = await this.generateText(jsonPrompt, { ...options, temperature: options.temperature ?? 0.2 })
        try {
            return JSON.parse(this.stripJsonCodeFence(result.text)) as T;
        } catch (error) {
            throw new AppError({
                statusCode: 502,
                code: "VALIDATION_ERROR",
                message: "Gemini returned invalid JSON"
            })
        }
    }

    private async callGemini(prompt: string, options: GenerateTextOptions): Promise<GeminiApiResponse> {
        const controller = new AbortController()
        const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs
        const timeout = setTimeout(() => controller.abort(), timeoutMs)
        const url = `${this.baseUrl}/models/${encodeURIComponent(this.model)}:generateContent`
        const body = { 
            systemInstruction: options.systemInstruction? { parts: [{ text: options.systemInstruction }] }: undefined,
            contents: this.buildContents(prompt, options.history),
            generationConfig: {
                temperature: options.temperature ?? 0.4,
                maxOutputTokens: options.maxOutputTokens ?? 512,
                thinkingConfig: {
                    thinkingBudget: 16
                }
            }
        }
        try {
            const response = await fetch(
                url, 
                { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey }, body: JSON.stringify(body) }
            )
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
        console.log(candidate.content)
        console.log(candidate.finishReason)
        const text = candidate.content?.parts?.map(part => part.text ?? "").join("").trim() ?? ""
        return text
    }

    private stripJsonCodeFence(text: string): string {
        return text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim()
    }
}

export const geminiService = new GeminiService({ apiKey: ENV.GEMINI_API_KEY, defaultTimeoutMs: ENV.GEMINI_TIMEOUT_MS })
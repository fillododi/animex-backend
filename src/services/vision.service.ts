import { ENV } from "../config/env";
import { MimeType } from "../schemas/vision.schema";
import { AppError } from "../middleware/errorHandler";
import { normalizeVisionSignal } from "../utils/normalizers";

export type VisionSignal = {
    source: "label" | "localizedObject" | "webEntity" | "bestGuess"
    text: string
    confidence: number
    boundingPoly?: {
        vertices?: {
            x: number,
            y: number
        }[],
        normalizedVertices?: {
            x: number,
            y: number
        }[]
    }[]
}

type VisionAnalysisResult = {
    signals: VisionSignal[]
    rawSummary: {
        labelCount: number
        objectCount: number
        webEntityCount: number
        bestGuessCount: number
    }
}

function getVisionStatus() {
    return { visionConfigured: Boolean(ENV.GOOGLE_CLOUD_VISION_API_KEY) }
}

async function analyzeImage(
    imageBytes: Buffer, 
    mimeType: MimeType, 
    requestId: string, 
    timeoutMs?: number
): Promise<VisionAnalysisResult> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    try {
        const requestBody = {
            requests: [
                {
                    image: {
                        content: imageBytes.toString("base64")
                    },
                    features: [
                        { type: "LABEL_DETECTION", maxResults: 10 },
                        { type: "OBJECT_LOCALIZATION", maxResults: 10 },
                        { type: "WEB_DETECTION", maxResults: 10 }
                    ]
                }
            ]
        }
        const response = await fetch(
            `https://vision.googleapis.com/v1/images:annotate?key=${ENV.GOOGLE_CLOUD_VISION_API_KEY}`, 
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody)
            }
        )
        if(!response.ok){
            throw new AppError({
                statusCode: 503,
                code: "SERVICE_UNAVAILABLE",
                message: `Google Vision returned HTTP ${response.status}.`
            })
        }
        const json = await response.json()
        const responseData = json?.responses?.[0]
        if (!responseData) {
            return {
                signals: [],
                rawSummary: {
                    labelCount: 0,
                    objectCount: 0,
                    webEntityCount: 0,
                    bestGuessCount: 0
                }
            }
        }
        const labelSignals: VisionSignal[] = responseData.labelAnnotations?.map((label: any) => normalizeVisionSignal({
            source: "label",
            text: String(label.description ?? ""),
            confidence: Number(label.score ?? 0)
        })).filter((signal: VisionSignal) => signal.text.length > 0) ?? []
        const objectSignals: VisionSignal[] = responseData.localizedObjectAnnotations?.map((object: any) => normalizeVisionSignal({
            source: "localizedObject",
            text: String(object.name ?? ""),
            confidence: Number(object.score ?? 0),
            boundingPoly: object.boundingPoly ?? []
        })).filter((signal: VisionSignal) => signal.text.length > 0) ?? []
        const webEntitiesSignals: VisionSignal[] = responseData.webDetection.webEntities?.map((entity: any) => normalizeVisionSignal({
            source: "webEntity",
            text: String(entity.description ?? ""),
            confidence: Number(entity.score ?? 0)
        })).filter((signal: VisionSignal) => signal.text.length > 0) ?? []
        const bestGuessSignals: VisionSignal[] = responseData.webDetection.bestGuessLabels?.map((label: any) => normalizeVisionSignal({
            source: "bestGuess",
            text: String(label.label ?? ""),
            confidence: 0.5
        })).filter((signal: VisionSignal) => signal.text.length > 0) ?? []
        return {
            signals: [...labelSignals, ...objectSignals, ...webEntitiesSignals, ...bestGuessSignals],
            rawSummary: {
                labelCount: labelSignals.length,
                objectCount: objectSignals.length,
                webEntityCount: webEntitiesSignals.length,
                bestGuessCount: bestGuessSignals.length
            }
        }
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            throw new AppError({
                statusCode: 504,
                code: "VISION_TIMEOUT",
                message: "Google Vision request timed out"
            })
        }
        throw new AppError({
            statusCode: 503,
            code: "SERVICE_UNAVAILABLE",
            message: "Google Vision is unavailable"
        })
    } finally {
      clearTimeout(timeout);
    }
}

export const visionService = {
    getVisionStatus,
    analyzeImage
}
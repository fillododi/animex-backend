import { ENV } from "../config/env";
import { AppError } from "../middleware/errorHandler"
import { MimeType, supportedImageMimeTypes } from "../schemas/vision.schema";

type DecodedImage = {
    buffer: Buffer;
    mimeType: MimeType;
    byteLength: number;
}

function getVisionStatus() {
    return { visionConfigured: Boolean(ENV.GOOGLE_CLOUD_VISION_API_KEY) }
}

function isJpeg(buffer: Buffer): boolean {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
}

function isPng(buffer: Buffer): boolean {
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    return buffer.length >= pngSignature.length && buffer.subarray(0, pngSignature.length).equals(pngSignature)
}

function validateMagicBytes(buffer: Buffer, mimeType: string): void {
    if (mimeType === "image/jpeg" && !isJpeg(buffer)) {
        throw new AppError({
            statusCode: 422,
            code: "MALFORMED_IMAGE",
            message: "Image payload was declared as JPEG, but its file signature is not JPEG.",
        })
    }
    if (mimeType === "image/png" && !isPng(buffer)) {
        throw new AppError({
            statusCode: 422,
            code: "MALFORMED_IMAGE",
            message: "Image payload was declared as PNG, but its file signature is not PNG.",
        })
    }
}

function parseBase64Image(imageBase64: string): { base64Payload: string, mimeTypeFromDataUrl?: string } {
    const trimmed = imageBase64.trim()
    const dataUrlMatch = trimmed.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/)
    if(dataUrlMatch) {
        return { base64Payload: dataUrlMatch[2].replace(/\s/g, ""), mimeTypeFromDataUrl: dataUrlMatch[1].toLowerCase() }
    }
    return { base64Payload: trimmed.replace(/\s/g, "") }
}

function decodeAndValidateImage(imageBase64: string, mimeType: string, maxImageBytes: number): DecodedImage {
    if(!supportedImageMimeTypes.some(m => m.toString() === mimeType)) {
        throw new AppError({
            statusCode: 415,
            code: "UNSUPPORTED_MEDIA_TYPE",
            message: "Only JPEG and PNG image payloads are supported."
        })
    }
    const parsed = parseBase64Image(imageBase64)
    if(parsed.mimeTypeFromDataUrl && parsed.mimeTypeFromDataUrl !== mimeType) {
        throw new AppError({
            statusCode: 415,
            code: "UNSUPPORTED_MEDIA_TYPE",
            message: "Declared MIME type does not match image data URL MIME type."
        })
    }
    let buffer: Buffer
    try {
        buffer = Buffer.from(parsed.base64Payload, "base64")
    } catch {
        throw new AppError({
            statusCode: 422,
            code: "MALFORMED_IMAGE",
            message: "Image payload is not valid base64."
        })
    }
    if (buffer.length === 0) {
        throw new AppError({
            statusCode: 422,
            code: "MALFORMED_IMAGE",
            message: "Image payload is empty."
        })
    }
    if (buffer.length > maxImageBytes) {
        throw new AppError({
            statusCode: 413,
            code: "PAYLOAD_TOO_LARGE",
            message: `Image payload exceeds the maximum decoded size of ${maxImageBytes} bytes.`
        })
    }
    validateMagicBytes(buffer, mimeType)
    return { buffer, mimeType: mimeType as MimeType, byteLength: buffer.length }
}

export const visionService = { getVisionStatus, decodeAndValidateImage }
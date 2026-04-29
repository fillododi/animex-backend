import { z } from "zod"

export const ApiMetaSchema = z.object({
    requestId: z.string(),
    timestamp: z.string()
})

export const ApiErrorSchema = z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
    retryable: z.boolean()
})

type ApiError = {
    code: string,
    message: string,
    details?: unknown,
    retryable?: boolean
}

export function success<T>(requestId: string, data: T) {
    return {
        ok: true as const,
        data,
        meta: {
            requestId,
            timestamp: new Date().toISOString()
        }
    }
}

export function failure(requestId: string, error: ApiError) {
    return {
        ok: false as const,
        error: {
            code: error.code,
            message: error.message,
            details: error.details,
            retryable: error.retryable ?? false
        },
        meta: {
            requestId,
            timestamp: new Date().toISOString()
        }
    }
}

export type ApiSuccess<T> = ReturnType<typeof success<T>>
export type ApiFailure = ReturnType<typeof failure>
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure
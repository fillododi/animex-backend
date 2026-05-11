import z from "zod";

const base64DataUrlRegex = /^data:(image\/jpeg|image\/png);base64,[A-Za-z0-9+/]+={0,2}$/

const rawBase64Regex = /^[A-Za-z0-9+/]+={0,2}$/

export const supportedImageMimeTypes = ["image/jpeg", "image/png"] as const

export const cropSchema = z.object({
    x: z.number().int().min(0),
    y: z.number().int().min(0),
    width: z.number().int().positive(),
    height: z.number().int().positive()
}).strict()

export const deviceHintsSchema = z.object({
    platform: z.enum(["ios", "android", "web"]).optional(),
    cameraFacing: z.enum(["environment", "user", "unknown"]).optional(),
    width: z.number().int().positive().max(4096).optional(),
    height: z.number().int().positive().max(4096).optional()
}).strict()

export const visionBodySchema = z.object({
    imageBase64: z.string()
        .min(1, "imageBase64 is required")
        .refine(
            value => base64DataUrlRegex.test(value) || rawBase64Regex.test(value), 
            "imageBase64 must be a valid JPEG/PNG data URL or raw base64 string"
        ),
    mimeType: z.enum(supportedImageMimeTypes, { message: "mimeType must be image/jpeg or image/png." }),
    clientFrameId: z.string()
        .min(1)
        .max(128)
        .regex(/^[a-zA-Z0-9._:-]+$/,"clientFrameId may only contain letters, numbers, dot, underscore, colon, or hyphen."),
    sessionId: z.string()
        .min(1)
        .max(128)
        .regex(/^[a-zA-Z0-9._:-]+$/, "sessionId may only contain letters, numbers, dot, underscore, colon, or hyphen."),
    previousAnimalId: z.string()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .optional(),
    crop: cropSchema.optional(),
    deviceHints: deviceHintsSchema.optional()
})

export type VisionBody = z.infer<typeof visionBodySchema>
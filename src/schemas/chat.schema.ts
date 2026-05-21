import z from "zod";

export const chatBodySchema = z.object({
    sessionId: z.string()
            .min(1)
            .max(128)
            .regex(/^[a-zA-Z0-9._:-]+$/, "sessionId may only contain letters, numbers, dot, underscore, colon, or hyphen."),
    animalId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    message: z.string().min(1).max(512),
    history: z.array(z.object({
        role: z.enum(["user", "model"]),
        text: z.string().min(1)
    })).max(8),
    inputMode: z.enum(["text", "voice"]).optional(),
    locale: z.string().min(1).max(5).optional(),
    ageBand: z.enum(["child", "teen", "general"]).optional()
})

export type ChatBody = z.infer<typeof chatBodySchema>
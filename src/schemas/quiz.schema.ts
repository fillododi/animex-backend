import z from "zod";

export const quizDifficultySchema = z.enum(["easy", "medium"])

export const quizModeSchema = z.enum(["animal", "habitat"])

export const nextQuizBodySchema = z.object({
    sessionId: z.string()
                .min(1)
                .max(128)
                .regex(/^[a-zA-Z0-9._:-]+$/, "sessionId may only contain letters, numbers, dot, underscore, colon, or hyphen."),
    animalId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    difficulty: quizDifficultySchema.optional(),
    mode: quizModeSchema.optional()
})

export type NextQuizBody = z.infer<typeof nextQuizBodySchema>
export type QuizDifficulty = z.infer<typeof quizDifficultySchema>
export type QuizMode = z.infer<typeof quizModeSchema>
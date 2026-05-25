import z from "zod";

export const quizDifficultySchema = z.enum(["easy", "medium"])

export const quizModeSchema = z.enum(["animal", "habitat"])

export const nextQuizBodySchema = z.object({
    sessionId: z.string()
                .min(1)
                .max(128)
                .regex(/^[a-zA-Z0-9._:-]+$/, "sessionId may only contain letters, numbers, dot, underscore, colon, or hyphen."),
    animalId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    previousQuestionIds: z.array(z.string().trim().min(1)).optional(),
    difficulty: quizDifficultySchema.optional(),
    mode: quizModeSchema.optional()
}).strict()

export const quizTypeSchema = z.enum(["multiple_choice", "yes_no", "open_text"])

export const quizQuestionSchema = z.object({
    id: z.string().trim().min(1),
    type: quizTypeSchema,
    prompt: z.string().trim().min(1),
    choices: z.array(z.string().trim().min(1)).optional(),
    acceptedAnswer: z.union([z.string().trim().min(1), z.boolean()]).optional(),
    feedback: z.string().trim().min(1),
    habitatRelated: z.boolean().optional()
})

export const validateQuizBodySchema = z.object({
    sessionId: z.string()
                .min(1)
                .max(128)
                .regex(/^[a-zA-Z0-9._:-]+$/, "sessionId may only contain letters, numbers, dot, underscore, colon, or hyphen."),
    questionId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    answer: z.union([z.string().trim().min(1), z.boolean()]),
    animalId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    prompt: z.string().trim().min(1),
})

export type NextQuizBody = z.infer<typeof nextQuizBodySchema>
export type QuizDifficulty = z.infer<typeof quizDifficultySchema>
export type QuizMode = z.infer<typeof quizModeSchema>
export type QuizQuestion = z.infer<typeof quizQuestionSchema>
export type QuizType = z.infer<typeof quizTypeSchema>
export type ValidateQuizBody = z.infer<typeof validateQuizBodySchema>
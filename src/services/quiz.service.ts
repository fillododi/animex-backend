import { AppError } from "../middleware/errorHandler";
import { Animal } from "../schemas/animal.schema";
import { NextQuizBody, QuizDifficulty, QuizMode, QuizQuestion, QuizType } from "../schemas/quiz.schema";
import { catalogService } from "./catalog.service";
import { geminiService } from "./gemini.service";

type QuizQuestionSource = "curated" | "gemini"

interface NextQuizQuestion {
    id?: string,
    type: QuizType,
    prompt: string,
    choices?: string[]
}

interface NextQuizResponse {
    question: NextQuizQuestion,
    answer?: string | boolean,
    source: QuizQuestionSource
}

interface GeneratedQuestion {
    type: QuizType,
    prompt: string,
    choices?: string[],
    answer?: string | boolean,
}

class QuizService {
    async getNextQuestion(input: NextQuizBody): Promise<NextQuizResponse> {
        const animal = catalogService.getAnimalById(input.animalId)
        if(!animal) {
            throw new AppError({ 
                statusCode: 404, 
                code: "ANIMAL_NOT_FOUND", 
                message: "Animal was not found in the database", 
                details: { animalId: input.animalId } 
            })
        }
        const curatedQuestion = this.selectCuratedQuestion(animal, input.previousQuestionIds ?? [], input.mode ?? "animal", input.difficulty)
        if(curatedQuestion) {
            return { 
                question: this.toPublicQuestion(curatedQuestion), 
                ...(curatedQuestion.acceptedAnswer? { answer: curatedQuestion.acceptedAnswer }: {} ),
                source: "curated" 
            }
        }
        const generatedQuestion = await this.generateQuestion(animal, input.mode ?? "animal", input.difficulty)
        if(generatedQuestion) {
            return { 
                question: { 
                    type: generatedQuestion.type, 
                    prompt: generatedQuestion.prompt, 
                    ...(generatedQuestion.choices? { choices: generatedQuestion.choices }: {}) 
                },
                ...(generatedQuestion.answer? { answer: generatedQuestion.answer }: {}),
                source: "gemini"
            }
        }
        throw new AppError({ statusCode: 404, code: "QUIZ_NOT_FOUND", message: "No quiz available" })
    }

    private selectCuratedQuestion(animal: Animal, previousQuestionIds: string[], mode: QuizMode, difficulty?: QuizDifficulty): QuizQuestion | null {
        const previousIds = new Set(previousQuestionIds)
        const quizzes = difficulty? animal.quiz.filter(quiz => quiz.difficulty === difficulty): animal.quiz
        const questions = quizzes.flatMap(quiz => quiz.questions)
            .filter(question => !previousIds.has(question.id))
            .filter(question => (mode === "animal" && !question.habitatRelated) || (mode == "habitat" && question.habitatRelated))
        if(questions.length > 0) return questions[0];
        return null
    }

    private async generateQuestion(animal: Animal, mode: QuizMode, difficulty?: QuizDifficulty): Promise<GeneratedQuestion | null> {
        const prompt = 
`
Create one question for a child using only this animal context.

Animal:
- Name: ${animal.displayName}
- Scientific name: ${animal.scientificName}
- Habitat: ${animal.habitat.summary}
- Diet: ${animal.diet.description}
- Facts: ${animal.facts.join(' | ')}

Mode: ${mode}
Difficulty: ${difficulty ?? 'easy'}

Return only JSON with this shape:
{
  "type": "multiple_choice" | "open_text" | "yes_no",
  "prompt": string,
  "choices"?: string[],
  "answer"?: string | boolean
}
choices is defined when type is "multiple_choice"
answer is not defined when type is "open_text", a string when type is "multiple_choice", a boolean when type is "yes_no"

Rules:
- The question must be answerable from the context.
- Keep the prompt short.
- Use Italian.
- For multiple_choice, provide exactly 3 choices.
- Do not invent facts.
`.trim()
        try {
            const question = await geminiService.generateJson<GeneratedQuestion>(prompt, { 
                systemInstruction: "You create safe animal quiz questions for children.",
                temperature: 0.2,
                maxOutputTokens: 260
            })
            if(!this.isValidGeneratedQuestion(question)) return null;
            return question
        } catch {
            return null
        }
    }

    private toPublicQuestion(question: QuizQuestion): NextQuizQuestion {
        return {
            id: question.id,
            type: question.type,
            prompt: question.prompt,
            ...(question.choices? { choices: question.choices }: {})
        }
    }

    private isValidGeneratedQuestion(question: GeneratedQuestion): boolean {
        if(!question || typeof question !== "object") return false;
        if(!question.prompt || typeof question.prompt !== "string") return false;
        if(
            !question.type || 
            typeof question.type !== "string" || 
            (question.type !== "multiple_choice" && question.type !== "open_text" && question.type !== "yes_no")
        ) {
            return false;
        }
        if (question.type === "multiple_choice" && !(Array.isArray(question.choices))) return false;
        return true
    }
}

export const quizService = new QuizService()
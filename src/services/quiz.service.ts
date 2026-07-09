import { AppError } from "../middleware/errorHandler";
import { Animal } from "../schemas/animal.schema";
import { NextQuizBody, QuizDifficulty, QuizMode, QuizQuestion, QuizType, ValidateQuizBody } from "../schemas/quiz.schema";
import { catalogService } from "./catalog.service";
import { geminiService } from "./gemini.service";

type QuizQuestionSource = "curated" | "gemini"

type QuizSuggestedAction = "continue" | "retry" | "chat"

interface NextQuizResponse {
    question: QuizQuestion,
    source: QuizQuestionSource
}

interface ValidateQuizResponse {
    correct: boolean | null,
    score: number,
    feedback: string,
    nextAction: QuizSuggestedAction
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
        const allowedQuizTypes = input.allowedQuizTypes ?? ["multiple_choice", "yes_no", "open_text"]
        const curatedQuestion = this.selectCuratedQuestion(animal, input.previousQuestionIds ?? [], input.mode ?? "animal", input.difficulty, allowedQuizTypes)
        if(curatedQuestion) {
            return { 
                question: curatedQuestion, 
                source: "curated" 
            }
        }
        const generatedQuestion = await this.generateQuestion(animal, input.mode ?? "animal", input.difficulty, allowedQuizTypes)
        if(generatedQuestion) {
            return { 
                question: generatedQuestion,
                source: "gemini"
            }
        }
        throw new AppError({ statusCode: 404, code: "QUIZ_NOT_FOUND", message: "No quiz available" })
    }

    async validateAnswer(input: ValidateQuizBody): Promise<ValidateQuizResponse> {
        const animal = catalogService.getAnimalById(input.animalId)
        if(!animal) {
            throw new AppError({ 
                statusCode: 404, 
                code: "ANIMAL_NOT_FOUND", 
                message: "Animal was not found in the database", 
                details: { animalId: input.animalId } 
            })
        }
        const normalizedAnswer = this.normalizeForMatching(input.answer.toString())
        const curatedQuestion = animal.quiz.flatMap(quiz => quiz.questions).find(question => question.id === input.questionId)
        if(!curatedQuestion || curatedQuestion.type === "open_text") return await this.validateAnswerWithGemini(animal, input.prompt, normalizedAnswer);
        const correct = this.validateDeterministically(curatedQuestion, normalizedAnswer)
        const score = correct? 1: 0
        const feedback = correct? curatedQuestion.feedback: "Ritenta, non è questa la risposta giusta..."
        const nextAction = correct? "continue": "retry"
        return { correct, score, feedback, nextAction }
    }

    private selectCuratedQuestion(animal: Animal, previousQuestionIds: string[], mode: QuizMode, difficulty?: QuizDifficulty, allowedQuizTypes?: QuizType[]): QuizQuestion | null {
        const previousIds = new Set(previousQuestionIds)
        const quizzes = difficulty? animal.quiz.filter(quiz => quiz.difficulty === difficulty): animal.quiz
        const questions = quizzes.flatMap(quiz => quiz.questions)
            .filter(question => !previousIds.has(question.id))
            .filter(question => (mode === "animal" && !question.habitatRelated) || (mode == "habitat" && question.habitatRelated))
            .filter(question => !allowedQuizTypes || allowedQuizTypes.includes(question.type))
        if(questions.length > 0) return questions[0];
        return null
    }

    private normalizeForMatching(text: string): string {
        return text.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim()
    }

    private async generateQuestion(animal: Animal, mode: QuizMode, difficulty?: QuizDifficulty, allowedQuizTypes?: QuizType[]): Promise<QuizQuestion | null> {
        const prompt = 
`
Create one random question for a child using this animal context as well as other fun facts about this animal.

Animal:
- Name: ${animal.displayName}
- Scientific name: ${animal.scientificName}
- Habitat: ${animal.habitat.summary}
- Diet: ${animal.diet.description}
- Facts: ${animal.facts.join(' | ')}

Mode: ${mode}
Difficulty: ${difficulty ?? 'easy'}
Allowed quiz types: ${allowedQuizTypes?.join(", ") ?? "every type"}

Return only JSON with this shape:
{
  "id": "string",
  "type": "multiple_choice" | "open_text" | "yes_no",
  "prompt": string,
  "choices"?: string[],
  "acceptedAnswers"?: string[],
  "feedback": string,
  "habitatRelated"?: boolean
}
choices is defined when type is "multiple_choice"
acceptedAnswers is 
- not defined when type is "open_text"
- an array of possible variants of the correct choice type is "multiple_choice"
- an array of "yes" or "no" variants when type is "yes_no". For instance, if the correct answer is yes, acceptedAnswers could be ["vero", "sì", "si"].
all strings in acceptedAnswers must be in italian.
habitatRelated depends on Mode, which can either be animal or habitat
type can only be one of the allowed quiz types.

Rules:
- The question must be answerable from the context.
- Keep the prompt short.
- Use Italian.
- Do not invent facts.
`.trim()
        try {
            const question = await geminiService.generateJson<QuizQuestion>(prompt, { 
                systemInstruction: "You create safe animal quiz questions for children.",
                temperature: 0.7,
                maxOutputTokens: 2000
            })
            return question
        } catch {
            return null
        }
    }

    private async validateAnswerWithGemini(animal: Animal, question: string, answer: string): Promise<ValidateQuizResponse> {
        const prompt =
`
You validate a child quiz answer for Animex, a wildlife discovery tool.

Animal:
- Name: ${animal.displayName}
- Scientific name: ${animal.scientificName}

Question:
${question}

Child answer:
${answer}

Return only JSON with this shape:
{
  "correct": true | false,
  "score": number,
  "feedback": string,
  "nextAction": "continue" | "retry" | "chat"
}

Rules:
- correct must be true only if the answer is clearly true.
- correct must be false if the answer is clearly wrong.
- correct must be null if the answer is unclear.
- score must be between 0 and 1.
- feedback must be short, friendly, and in Italian.
- nextAction represents the suggested new action for the user.
`.trim()
        const result = await geminiService.generateJson<ValidateQuizResponse>(
            prompt, 
            { systemInstruction: "You are a strict but friendly quiz validator for children.", temperature: 0.1, maxOutputTokens: 160 }
        )
        return result
    }

    private validateDeterministically(question: QuizQuestion, answer: string): boolean {
        const acceptedAnswers = (question.acceptedAnswers ?? []).map(answer => this.normalizeForMatching(answer))
        return acceptedAnswers.includes(answer)
    }
}

export const quizService = new QuizService()
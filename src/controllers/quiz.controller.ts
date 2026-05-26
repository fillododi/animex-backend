import { Request, Response } from "express"
import { NextQuizBody, ValidateQuizBody } from "../schemas/quiz.schema"
import { quizService } from "../services/quiz.service"
import { success } from "../schemas/api.schema"

async function nextQuiz(req: Request, res: Response) {
    const body: NextQuizBody = req.body
    const data = await quizService.getNextQuestion(body)
    return res.status(200).json(success(req.requestId, data))
}

async function validateQuiz(req: Request, res: Response) {
    const body: ValidateQuizBody = req.body
    const data = await quizService.validateAnswer(body)
    return res.status(200).json(success(req.requestId, data))
}

export const quizController = { nextQuiz, validateQuiz }
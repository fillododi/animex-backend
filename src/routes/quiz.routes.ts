import { Router } from "express";
import { validatedRoute } from "../middleware/validate";
import { nextQuizBodySchema, validateQuizBodySchema } from "../schemas/quiz.schema";
import { asyncHandler } from "../utils/asyncHandler";
import { quizController } from "../controllers/quiz.controller";

const router = Router()

router.post("/next", validatedRoute({ body: nextQuizBodySchema }, asyncHandler(quizController.nextQuiz)))
router.post("/validate", validatedRoute({ body: validateQuizBodySchema }, asyncHandler(quizController.validateQuiz)))

export const quizRouter = router
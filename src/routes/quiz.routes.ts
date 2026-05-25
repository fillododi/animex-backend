import { Router } from "express";
import { validatedRoute } from "../middleware/validate";
import { nextQuizBodySchema } from "../schemas/quiz.schema";
import { asyncHandler } from "../utils/asyncHandler";
import { quizController } from "../controllers/quiz.controller";

const router = Router()

router.post("/next", validatedRoute({ body: nextQuizBodySchema }, asyncHandler(quizController.nextQuiz)))

export const quizRouter = router
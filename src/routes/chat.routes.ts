import { Router } from "express";
import { chatBodySchema } from "../schemas/chat.schema";
import { asyncHandler } from "../utils/asyncHandler";
import { chatController } from "../controllers/chat.controller";
import { validatedRoute } from "../middleware/validate";

const router = Router()

router.post("/", validatedRoute({ body: chatBodySchema }, asyncHandler(chatController.postChat)))

export const chatRouter = router
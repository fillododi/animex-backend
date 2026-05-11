import { Router } from "express";
import { validatedRoute } from "../middleware/validate";
import { visionBodySchema } from "../schemas/vision.schema";
import { visionController } from "../controllers/vision.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router()

router.post("/identify", validatedRoute({ body: visionBodySchema }, asyncHandler(visionController.identify)))

export const visionRouter = router
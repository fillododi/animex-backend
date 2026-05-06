import { Router } from "express";
import { success } from "../schemas/api.schema";
import { ENV } from "../config/env";
import { features } from "node:process";

const router = Router()

router.get("/", (_req, _res) => {
    return _res.status(200).json(success(_req.requestId, {
        name: "animex-backend",
        version: process.env.npm_package_version ?? "0.0.0",
        environment: ENV.NODE_ENV,
        features: {
            vision: Boolean(ENV.GOOGLE_CLOUD_VISION_API_KEY),
            chat: Boolean(ENV.GEMINI_API_KEY),
            quiz: true,
            habitats: true
        }
    }))
})

export const versionRouter = router
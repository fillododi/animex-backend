import { Router, Request, Response, NextFunction } from "express"
import { getAnimalCatalogStatus } from "../services/animalCatalog.service"
import { getVisionStatus } from "../services/vision.service"
import { getGeminitatus } from "../services/gemini.service"
import { failure, success } from "../schemas/api.schema"
import { AppError } from "../middleware/errorHandler"

const router = Router()

router.get("/healthz", (_req: Request, _res: Response) => {
    return _res.status(200).json({ ok: true, status: "live" })
})

router.get("/readyz", (_req: Request, _res: Response, _next: NextFunction) => {
    const catalog = getAnimalCatalogStatus()
    const vision = getVisionStatus()
    const gemini = getGeminitatus()
    const ready = catalog.loaded && 
        catalog.animalsLoaded > 0 && 
        vision.visionConfigured && 
        gemini.geminiConfigured
    if(!ready) {
        return _res.status(503).json(failure(_req.requestId, {
            code: "SERVICE_UNAVAILABLE",
            message: "Backend is not ready",
            details: {
                catalog,
                vision,
                gemini
            }
        }))
    }
    return _res.status(200).json(success(_req.requestId, { 
        ready: true, 
        animalsLoaded: catalog.animalsLoaded, 
        visionConfigured: true,
        geminiConfigured: true
    }))
})

export const healthRouter = router